use axum::{
    extract::{State, Path, WebSocketUpgrade},
    http::{HeaderMap, StatusCode},
    response::{Json, IntoResponse},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use tracing::info;
use uuid::Uuid;

mod db;
mod ai_service;
mod auth_paseto;

use db::{DbPool, User, Workspace};
use auth_paseto::{issue_v4_public, build_default_claims, PasetoClaims};
use ai_service::{AiService, WorkflowNode};

#[derive(Serialize, Deserialize)]
pub struct CreateUser {
    pub email: String,
    pub name: String,
    pub auth_provider_id: String,
}


#[derive(Serialize, Deserialize)]
pub struct CreateWorkspace {
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct WorkflowRequest {
    pub message: String,
    pub workspace_id: Uuid,
}


#[derive(Serialize, Deserialize)]
pub struct WorkflowResponse {
    pub nodes: Vec<WorkflowNode>,
    pub output: String,
}

#[derive(Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}

// Application state
#[derive(Clone)]
pub struct AppState {
    pub db_pool: DbPool,
    pub ai_service: AiService,
    pub gcp_project_id: String,
    pub paseto_keys: auth_paseto::PasetoKeys,
}

// Validate PASETO v4.public token and return claims
async fn validate_paseto(headers: HeaderMap, keys: &auth_paseto::PasetoKeys) -> Result<auth_paseto::PasetoClaims, StatusCode> {
    let auth_header = headers
        .get("authorization")
        .ok_or(StatusCode::UNAUTHORIZED)?
        .to_str()
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") { return Err(StatusCode::UNAUTHORIZED); }
    let token = &auth_header[7..];
    auth_paseto::verify_v4_public(keys, token).map_err(|_| StatusCode::UNAUTHORIZED)
}

// Handlers
async fn health_check() -> Json<ApiResponse<String>> {
    Json(ApiResponse {
        success: true,
        data: Some("Backend is running with ParadeDB!".to_string()),
        message: "Health check passed".to_string(),
    })
}

async fn get_users(State(_state): State<AppState>) -> Json<ApiResponse<Vec<User>>> {
    // For now, return empty list - users are created dynamically through auth
    Json(ApiResponse {
        success: true,
        data: Some(vec![]),
        message: "Users retrieved successfully".to_string(),
    })
}

async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<Json<ApiResponse<User>>, StatusCode> {
    let user = User::create(&state.db_pool, payload.email, payload.name, payload.auth_provider_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some(user),
        message: "User created successfully".to_string(),
    }))
}

async fn get_user(
    State(_state): State<AppState>,
    Path(_user_id): Path<Uuid>,
) -> impl IntoResponse {
    // Users are managed through Kinde auth, not stored separately
    StatusCode::NOT_FOUND
}

// WebSocket handler for real-time features
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(_state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: axum::extract::ws::WebSocket) {
    use axum::extract::ws::Message;
    
    while let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    info!("Received: {}", text);
                    // Echo back for now
                    if socket.send(Message::Text(format!("Echo: {}", text))).await.is_err() {
                        break;
                    }
                }
                Message::Binary(_) => {
                    info!("Received binary data");
                }
                Message::Close(_) => {
                    info!("WebSocket connection closed");
                    break;
                }
                _ => {}
            }
        } else {
            break;
        }
    }
}

// Google OAuth verification (minimal): reads Authorization: Bearer <access_token> and returns Google userinfo
#[derive(Serialize, Deserialize)]
pub struct GoogleUserInfo {
    pub sub: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
}

// Reusable helper: read bearer token from headers, call Google userinfo, parse JSON
async fn require_google_user(headers: &HeaderMap, client: &reqwest::Client) -> Result<GoogleUserInfo, StatusCode> {
    let auth_header = headers.get("authorization").ok_or(StatusCode::UNAUTHORIZED)?
        .to_str().map_err(|_| StatusCode::UNAUTHORIZED)?;
    if !auth_header.starts_with("Bearer ") { return Err(StatusCode::UNAUTHORIZED); }
    let token = &auth_header[7..];
    let resp = client
        .get("https://www.googleapis.com/oauth2/v3/userinfo")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;
    if !resp.status().is_success() { return Err(StatusCode::UNAUTHORIZED); }
    resp.json::<GoogleUserInfo>().await.map_err(|_| StatusCode::BAD_GATEWAY)
}

async fn google_verify(headers: HeaderMap) -> Result<Json<ApiResponse<GoogleUserInfo>>, StatusCode> {
    let client = reqwest::Client::new();
    let info = require_google_user(&headers, &client).await?;
    Ok(Json(ApiResponse { success: true, data: Some(info), message: "Google token verified".to_string() }))
}


// PASETO login: exchange Google access token for a PASETO v4.public
#[derive(Serialize, Deserialize)]
pub struct PasetoLoginRequest { pub access_token: String }

#[derive(Serialize, Deserialize)]
pub struct PasetoLoginResponse { pub token: String, pub claims: PasetoClaims }

async fn paseto_login(
    State(state): State<AppState>,
    Json(payload): Json<PasetoLoginRequest>,
) -> Result<Json<ApiResponse<PasetoLoginResponse>>, StatusCode> {
    if payload.access_token.is_empty() { return Err(StatusCode::BAD_REQUEST); }
    let client = reqwest::Client::new();
    // Emulate Authorization header for reuse
    let mut hdrs = HeaderMap::new();
    hdrs.insert("authorization", format!("Bearer {}", payload.access_token).parse().map_err(|_| StatusCode::BAD_REQUEST)?);
    let info = require_google_user(&hdrs, &client).await?;

    let claims = build_default_claims(info.sub.clone(), info.email.clone(), info.name.clone());
    let token = issue_v4_public(&state.paseto_keys, &claims).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some(PasetoLoginResponse { token, claims }),
        message: "PASETO issued".to_string(),
    }))
}

// Workspace handlers
async fn get_workspaces(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<Workspace>>>, StatusCode> {
let _claims = validate_paseto(headers, &state.paseto_keys).await?;
    // TODO: map claims.sub (auth_provider_id) -> internal user_id via DB
    let user_id = Uuid::new_v4(); // placeholder: replace with lookup
    
    let workspaces = Workspace::find_by_user_id(&state.db_pool, user_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(ApiResponse {
        success: true,
        data: Some(workspaces),
        message: "Workspaces retrieved successfully".to_string(),
    }))
}

async fn create_workspace(
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(payload): Json<CreateWorkspace>,
) -> Result<Json<ApiResponse<Workspace>>, StatusCode> {
let _claims = validate_paseto(headers, &state.paseto_keys).await?;
    // TODO: map claims.sub (auth_provider_id) -> internal user_id via DB
    let user_id = Uuid::new_v4(); // placeholder: replace with lookup
    
    let workspace = Workspace::create(&state.db_pool, payload.name, user_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some(workspace),
        message: "Workspace created successfully".to_string(),
    }))
}

// AI Workflow handlers
async fn process_workflow(
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(payload): Json<WorkflowRequest>,
) -> Result<Json<ApiResponse<WorkflowResponse>>, StatusCode> {
    let _claims = validate_paseto(headers, &state.paseto_keys).await?;
    
    info!("Processing workflow for message: {}", payload.message);
    
    // Use the AI service to process the workflow with OpenRouter and fallbacks
    match state.ai_service.process_workflow(&payload.message).await {
        Ok(nodes) => {
            let output = nodes
                .iter()
                .filter(|n| n.status == "completed" && n.output.is_some())
                .map(|n| format!("{}: {}", n.title, n.output.as_ref().unwrap_or(&"No output".to_string())))
                .collect::<Vec<_>>()
                .join("\n\n");
            
            Ok(Json(ApiResponse {
                success: true,
                data: Some(WorkflowResponse { nodes, output }),
                message: "Workflow processing completed successfully".to_string(),
            }))
        }
        Err(e) => {
            info!("Workflow processing failed: {}", e);
            
            // Return error nodes for visualization
            let error_nodes = vec![
                WorkflowNode {
                    id: Uuid::new_v4().to_string(),
                    node_type: "error".to_string(),
                    status: "error".to_string(),
                    title: "Processing Error".to_string(),
                    description: "Failed to process workflow with AI service".to_string(),
                    output: Some(format!("Error: {}", e)),
                },
            ];
            
            Ok(Json(ApiResponse {
                success: false,
                data: Some(WorkflowResponse { 
                    nodes: error_nodes, 
                    output: format!("Failed to process workflow: {}", e) 
                }),
                message: "Workflow processing failed".to_string(),
            }))
        }
    }
}

// OpenRouter models endpoint
async fn get_openrouter_models(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, StatusCode> {
    let _claims = validate_paseto(headers, &state.paseto_keys).await?;
    
    match state.ai_service.list_available_models().await {
        Ok(models) => Ok(Json(ApiResponse {
            success: true,
            data: Some(models),
            message: "Available models retrieved from OpenRouter".to_string(),
        })),
        Err(e) => {
            info!("Failed to fetch OpenRouter models: {}", e);
            
            // Fallback to hardcoded models matching our AI service fallback strategy
            let fallback_models = vec![
                serde_json::json!({
                    "id": "anthropic/claude-3-5-sonnet-20241022",
                    "name": "Claude 3.5 Sonnet",
                    "provider": "Anthropic"
                }),
                serde_json::json!({
                    "id": "openai/gpt-4o-2024-11-20",
                    "name": "GPT-4o",
                    "provider": "OpenAI"
                }),
                serde_json::json!({
                    "id": "google/gemini-pro-1.5-latest",
                    "name": "Gemini Pro 1.5",
                    "provider": "Google"
                }),
                serde_json::json!({
                    "id": "google/gemini-flash-1.5-8b",
                    "name": "Gemini Flash 1.5",
                    "provider": "Google"
                })
            ];
            
            Ok(Json(ApiResponse {
                success: true,
                data: Some(fallback_models),
                message: "Available models retrieved (fallback)".to_string(),
            }))
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize database connection
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://localhost/blabout".to_string());
    
    let db_pool = db::create_pool(&database_url).await?;
    db::init_schema(&db_pool).await?;

    // Initialize AI service
    let openrouter_key = std::env::var("OPENROUTER_API_KEY").unwrap_or_default();
    let ai_service = AiService::new(openrouter_key);

    // Initialize application state
    // Load PASETO keys from env (base64url, no padding) – store via Secret Manager
    let pk_b64 = std::env::var("PASETO_V4_PUBLIC_KEY_B64").unwrap_or_default();
    let sk_b64_opt = std::env::var("PASETO_V4_SECRET_KEY_B64").ok();
    let paseto_keys = auth_paseto::PasetoKeys::from_base64(&pk_b64, sk_b64_opt.as_deref())
        .map_err(|e| format!("PASETO key load error: {}", e))?;

    let app_state = AppState {
        db_pool,
        ai_service,
        gcp_project_id: std::env::var("GOOGLE_CLOUD_PROJECT_ID").unwrap_or_default(),
        paseto_keys,
    };

    // Build our application with routes
    let app = Router::new()
.route("/health", get(health_check))
        .route("/_health", get(health_check))
        .route("/api/users", get(get_users).post(create_user))
        .route("/api/users/:id", get(get_user))
        .route("/api/workspaces", get(get_workspaces).post(create_workspace))
        .route("/api/workflow/process", post(process_workflow))
        .route("/api/models", get(get_openrouter_models))
        .route("/ws", get(websocket_handler))
        .route("/auth/paseto/login", post(paseto_login))
        .route("/auth/google/verify", get(google_verify))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse::<u16>()
        .unwrap_or(3001);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    
    info!("🚀 Backend server running on http://localhost:{}", port);
    info!("📊 WebSocket endpoint: ws://localhost:{}/ws", port);
info!("🔐 Auth endpoint: GET /auth/google/verify");
    info!("🔐 Auth endpoint: POST /auth/paseto/login");

    axum::serve(listener, app).await?;

    Ok(())
}
