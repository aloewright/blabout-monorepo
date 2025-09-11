use axum::{
    extract::{State, Path, Query, WebSocketUpgrade},
    http::{HeaderMap, StatusCode},
    response::{Json, IntoResponse},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tower_http::cors::CorsLayer;
use tracing::info;
use uuid::Uuid;

mod db;
mod ai_service;

use db::{DbPool, User, Workspace};
use ai_service::{AiService, WorkflowNode};

#[derive(Serialize, Deserialize)]
pub struct CreateUser {
    pub email: String,
    pub name: String,
    pub kinde_id: String,
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
    pub kinde_config: KindeConfig,
    pub gcp_project_id: String,
}

#[derive(Clone)]
pub struct KindeConfig {
    pub domain: String,
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

// Auth middleware
async fn validate_kinde_token(headers: HeaderMap) -> Result<String, StatusCode> {
    let auth_header = headers
        .get("authorization")
        .ok_or(StatusCode::UNAUTHORIZED)?
        .to_str()
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];
    // TODO: Implement actual Kinde JWT validation
    // For now, just check if token exists
    if token.is_empty() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(token.to_string())
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
    let user = User::create(&state.db_pool, payload.email, payload.name, payload.kinde_id)
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

// Kinde OAuth handlers
async fn kinde_login(State(state): State<AppState>) -> impl IntoResponse {
    let auth_url = format!(
        "{}/oauth2/auth?client_id={}&redirect_uri={}&response_type=code&scope=openid profile email",
        state.kinde_config.domain,
        state.kinde_config.client_id,
        state.kinde_config.redirect_uri
    );
    
    Json(ApiResponse {
        success: true,
        data: Some(auth_url),
        message: "Kinde login URL generated".to_string(),
    })
}

async fn kinde_callback(
    State(_state): State<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    let code = params.get("code").ok_or(StatusCode::BAD_REQUEST)?;
    
    // TODO: Exchange code for token with Kinde
    info!("Received auth code: {}", code);
    
    Ok(Json(ApiResponse {
        success: true,
        data: Some("Authentication successful".to_string()),
        message: "User authenticated with Kinde".to_string(),
    }))
}

// Workspace handlers
async fn get_workspaces(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<Workspace>>>, StatusCode> {
    let _token = validate_kinde_token(headers).await?;
    
    // TODO: Get user_id from JWT token
    let user_id = Uuid::new_v4(); // Mock for now
    
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
    let _token = validate_kinde_token(headers).await?;
    
    // TODO: Get user_id from JWT token
    let user_id = Uuid::new_v4(); // Mock user for now
    
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
    let _token = validate_kinde_token(headers).await?;
    
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
    let _token = validate_kinde_token(headers).await?;
    
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
    let kinde_config = KindeConfig {
        domain: std::env::var("KINDE_DOMAIN").unwrap_or_else(|_| "https://blabout.kinde.com".to_string()),
        client_id: std::env::var("KINDE_CLIENT_ID").unwrap_or_default(),
        client_secret: std::env::var("KINDE_CLIENT_SECRET").unwrap_or_default(),
        redirect_uri: std::env::var("KINDE_REDIRECT_URI").unwrap_or_else(|_| "https://blabout.com/auth/callback".to_string()),
    };

    let app_state = AppState {
        db_pool,
        ai_service,
        kinde_config,
        gcp_project_id: std::env::var("GOOGLE_CLOUD_PROJECT_ID").unwrap_or_default(),
    };

    // Build our application with routes
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/users", get(get_users).post(create_user))
        .route("/api/users/:id", get(get_user))
        .route("/api/workspaces", get(get_workspaces).post(create_workspace))
        .route("/api/workflow/process", post(process_workflow))
        .route("/api/models", get(get_openrouter_models))
        .route("/ws", get(websocket_handler))
        .route("/auth/login", get(kinde_login))
        .route("/auth/callback", get(kinde_callback))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse::<u16>()
        .unwrap_or(3001);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    
    info!("🚀 Backend server running on http://localhost:{}", port);
    info!("📊 WebSocket endpoint: ws://localhost:{}/ws", port);
    info!("🔐 Auth endpoints: /auth/login, /auth/callback");

    axum::serve(listener, app).await?;

    Ok(())
}
