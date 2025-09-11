use axum::{
    extract::{Query, State, WebSocketUpgrade, Path},
    http::{StatusCode, HeaderMap},
    response::{Json, IntoResponse},
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing::{info, error};
use uuid::Uuid;

// Database models
#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub kinde_id: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, Deserialize)]
pub struct CreateUser {
    pub email: String,
    pub name: String,
    pub kinde_id: String,
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
    pub users: Arc<RwLock<HashMap<Uuid, User>>>,
    pub kinde_config: KindeConfig,
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

async fn get_users(State(state): State<AppState>) -> Json<ApiResponse<Vec<User>>> {
    let users = state.users.read().await;
    let user_list: Vec<User> = users.values().cloned().collect();
    
    Json(ApiResponse {
        success: true,
        data: Some(user_list),
        message: "Users retrieved successfully".to_string(),
    })
}

async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<Json<ApiResponse<User>>, StatusCode> {
    let user = User {
        id: Uuid::new_v4(),
        email: payload.email,
        name: payload.name,
        kinde_id: payload.kinde_id,
        created_at: chrono::Utc::now(),
    };

    let mut users = state.users.write().await;
    users.insert(user.id, user.clone());

    Ok(Json(ApiResponse {
        success: true,
        data: Some(user),
        message: "User created successfully".to_string(),
    }))
}

async fn get_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<ApiResponse<User>>, StatusCode> {
    let users = state.users.read().await;
    
    match users.get(&user_id) {
        Some(user) => Ok(Json(ApiResponse {
            success: true,
            data: Some(user.clone()),
            message: "User found".to_string(),
        })),
        None => Err(StatusCode::NOT_FOUND),
    }
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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize application state
    let kinde_config = KindeConfig {
        domain: std::env::var("KINDE_DOMAIN").unwrap_or_else(|_| "https://your-domain.kinde.com".to_string()),
        client_id: std::env::var("KINDE_CLIENT_ID").unwrap_or_default(),
        client_secret: std::env::var("KINDE_CLIENT_SECRET").unwrap_or_default(),
        redirect_uri: std::env::var("KINDE_REDIRECT_URI").unwrap_or_else(|_| "http://localhost:3000/auth/callback".to_string()),
    };

    let app_state = AppState {
        users: Arc::new(RwLock::new(HashMap::new())),
        kinde_config,
    };

    // Build our application with routes
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/users", get(get_users).post(create_user))
        .route("/api/users/:id", get(get_user))
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
