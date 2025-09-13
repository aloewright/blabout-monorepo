use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Duration;
use tracing::{info, warn};

#[derive(Debug, Clone)]
pub struct AiService {
    client: Client,
    openrouter_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AiResponse {
    pub content: String,
    pub model_used: String,
    pub provider: String,
}

#[derive(Debug, Clone)]
pub struct ModelConfig {
    pub name: &'static str,
    pub provider: &'static str,
    pub endpoint: &'static str,
}

impl AiService {
    pub fn new(openrouter_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .unwrap();

        Self {
            client,
            openrouter_key,
        }
    }

    // Primary models with fallbacks: Claude 4 Sonnet 1M -> GPT 5 -> Gemini 2.5 Pro/Flash Lite
    fn get_model_fallbacks() -> Vec<ModelConfig> {
        vec![
            // Primary: Claude 4 Sonnet 1M (using latest Claude Sonnet)
            ModelConfig {
                name: "anthropic/claude-3-5-sonnet-20241022",
                provider: "Anthropic (OpenRouter)",
                endpoint: "https://openrouter.ai/api/v1/chat/completions",
            },
            // Secondary: GPT 5 (using latest GPT-4 until GPT-5 is available)
            ModelConfig {
                name: "openai/gpt-4o-2024-11-20",
                provider: "OpenAI (OpenRouter)",
                endpoint: "https://openrouter.ai/api/v1/chat/completions",
            },
            // Tertiary: Gemini 2.5 Pro (using latest Gemini Pro)
            ModelConfig {
                name: "google/gemini-pro-1.5-latest",
                provider: "Google (OpenRouter)",
                endpoint: "https://openrouter.ai/api/v1/chat/completions",
            },
            // Quaternary: Gemini 2.5 Flash Lite (using latest Gemini Flash)
            ModelConfig {
                name: "google/gemini-flash-1.5-8b",
                provider: "Google (OpenRouter)",
                endpoint: "https://openrouter.ai/api/v1/chat/completions",
            },
        ]
    }

    pub async fn generate_response(&self, messages: Vec<ChatMessage>) -> Result<AiResponse> {
        let models = Self::get_model_fallbacks();
        let mut last_error = None;

        for model in models {
            match self.try_model(&model, &messages).await {
                Ok(response) => {
                    info!("Successfully generated response using {} ({})", model.name, model.provider);
                    return Ok(AiResponse {
                        content: response,
                        model_used: model.name.to_string(),
                        provider: model.provider.to_string(),
                    });
                }
                Err(e) => {
                    warn!("Failed to use model {} ({}): {}", model.name, model.provider, e);
                    last_error = Some(e);
                }
            }
        }

        Err(last_error.unwrap_or_else(|| anyhow!("All AI models failed")))
    }

    async fn try_model(&self, model: &ModelConfig, messages: &[ChatMessage]) -> Result<String> {
        let payload = json!({
            "model": model.name,
            "messages": messages,
            "max_tokens": 4000,
            "temperature": 0.7,
            "top_p": 0.9,
            "stream": false
        });

        let response = self
            .client
            .post(model.endpoint)
            .header("Authorization", format!("Bearer {}", self.openrouter_key))
            .header("Content-Type", "application/json")
            .header("HTTP-Referer", "https://blabout.com")
            .header("X-Title", "Blabout AI Workspace")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("API error: {}", error_text));
        }

        let json: Value = response.json().await?;
        
        let content = json
            .get("choices")
            .and_then(|choices| choices.get(0))
            .and_then(|choice| choice.get("message"))
            .and_then(|message| message.get("content"))
            .and_then(|content| content.as_str())
            .ok_or_else(|| anyhow!("Invalid response format"))?;

        Ok(content.to_string())
    }

    pub async fn process_workflow(&self, user_message: &str) -> Result<Vec<WorkflowNode>> {
        // Create planning agent
        let planner_messages = vec![
            ChatMessage {
                role: "system".to_string(),
                content: "You are an AI planning agent. Break down the user's request into actionable steps for a coding workflow. Respond with a JSON array of steps, each with 'title', 'description', and 'agent_type' fields.".to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_message.to_string(),
            },
        ];

        let planner_response = self.generate_response(planner_messages).await?;
        
        // For demo purposes, create workflow nodes
        let mut nodes = vec![
            WorkflowNode {
                id: uuid::Uuid::new_v4().to_string(),
                node_type: "planner".to_string(),
                status: "completed".to_string(),
                title: "Planning Agent".to_string(),
                description: "Analyzing request and creating execution plan".to_string(),
                output: Some(planner_response.content.clone()),
            },
            WorkflowNode {
                id: uuid::Uuid::new_v4().to_string(),
                node_type: "coder".to_string(),
                status: "processing".to_string(),
                title: "Code Generator".to_string(),
                description: "Implementing the planned solution".to_string(),
                output: None,
            },
            WorkflowNode {
                id: uuid::Uuid::new_v4().to_string(),
                node_type: "reviewer".to_string(),
                status: "pending".to_string(),
                title: "Code Reviewer".to_string(),
                description: "Reviewing and optimizing the generated code".to_string(),
                output: None,
            },
        ];

        // Process coding agent
        let coder_messages = vec![
            ChatMessage {
                role: "system".to_string(),
                content: "You are a senior software engineer. Based on the planning output, write clean, production-ready code. Focus on best practices, error handling, and maintainability.".to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: format!("Plan: {}\n\nOriginal request: {}", planner_response.content, user_message),
            },
        ];

        if let Ok(coder_response) = self.generate_response(coder_messages).await {
            nodes[1].status = "completed".to_string();
            nodes[1].output = Some(coder_response.content.clone());
            nodes[2].status = "processing".to_string();

            // Process reviewer agent
            let reviewer_messages = vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: "You are a code review expert. Analyze the provided code for improvements, security issues, and optimization opportunities. Provide constructive feedback.".to_string(),
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: format!("Code to review: {}", coder_response.content),
                },
            ];

            if let Ok(reviewer_response) = self.generate_response(reviewer_messages).await {
                nodes[2].status = "completed".to_string();
                nodes[2].output = Some(reviewer_response.content);
            }
        }

        Ok(nodes)
    }

    pub async fn list_available_models(&self) -> Result<Vec<Value>> {
        let response = self
            .client
            .get("https://openrouter.ai/api/v1/models")
            .header("Authorization", format!("Bearer {}", self.openrouter_key))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Failed to fetch models"));
        }

        let json: Value = response.json().await?;
        let models = json
            .get("data")
            .and_then(|data| data.as_array())
            .cloned()
            .unwrap_or_default();

        Ok(models)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    pub id: String,
    pub node_type: String,
    pub status: String,
    pub title: String,
    pub description: String,
    pub output: Option<String>,
}
