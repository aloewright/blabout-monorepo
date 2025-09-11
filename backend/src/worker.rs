use worker::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: String,
    pub kinde_id: String,
}

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    let router = Router::new();

    router
        .get_async("/health", |_req, _ctx| async move {
            let response = ApiResponse {
                success: true,
                data: Some("Cloudflare Worker backend is running!".to_string()),
                message: "Health check passed".to_string(),
            };
            Response::from_json(&response)
        })
        .get_async("/api/users", |_req, ctx| async move {
            // Get users from KV storage or D1 database
            let kv = ctx.kv("USERS")?;
            
            // For now, return empty array
            let users: Vec<User> = vec![];
            
            let response = ApiResponse {
                success: true,
                data: Some(users),
                message: "Users retrieved successfully".to_string(),
            };
            Response::from_json(&response)
        })
        .post_async("/api/users", |mut req, ctx| async move {
            let user_data: HashMap<String, String> = req.json().await?;
            
            let user = User {
                id: format!("user_{}", js_sys::Date::now() as u64),
                email: user_data.get("email").unwrap_or(&"".to_string()).clone(),
                name: user_data.get("name").unwrap_or(&"".to_string()).clone(),
                kinde_id: user_data.get("kinde_id").unwrap_or(&"".to_string()).clone(),
            };

            // Store in KV
            let kv = ctx.kv("USERS")?;
            kv.put(&user.id, &user)?.execute().await?;

            let response = ApiResponse {
                success: true,
                data: Some(user),
                message: "User created successfully".to_string(),
            };
            Response::from_json(&response)
        })
        .get_async("/auth/login", |_req, ctx| async move {
            let kinde_domain = ctx.var("KINDE_DOMAIN")?.to_string();
            let client_id = ctx.var("KINDE_CLIENT_ID")?.to_string();
            let redirect_uri = ctx.var("KINDE_REDIRECT_URI")?.to_string();
            
            let auth_url = format!(
                "{}/oauth2/auth?client_id={}&redirect_uri={}&response_type=code&scope=openid profile email",
                kinde_domain, client_id, redirect_uri
            );
            
            let response = ApiResponse {
                success: true,
                data: Some(auth_url),
                message: "Kinde login URL generated".to_string(),
            };
            Response::from_json(&response)
        })
        .run(req, env)
        .await
}
