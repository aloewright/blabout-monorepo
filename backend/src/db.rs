use anyhow::Result;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio_postgres::{NoTls, Row};
use uuid::Uuid;

pub type DbPool = Pool<PostgresConnectionManager<NoTls>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub auth_provider_id: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: Uuid,
    pub name: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowExecution {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub message: String,
    pub status: String,
    pub result: Option<String>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

pub async fn create_pool(database_url: &str) -> Result<DbPool> {
    let manager = PostgresConnectionManager::new_from_stringlike(database_url, NoTls)?;
    let pool = Pool::builder()
        .max_size(15)
        .build(manager)
        .await?;
    
    Ok(pool)
}

pub async fn init_schema(pool: &DbPool) -> Result<()> {
    let conn = pool.get().await?;
    
    // Create users table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR NOT NULL UNIQUE,
            name VARCHAR NOT NULL,
            kinde_id VARCHAR NOT NULL UNIQUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )",
        &[],
    ).await?;

    // Create workspaces table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS workspaces (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            user_id UUID NOT NULL REFERENCES users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )",
        &[],
    ).await?;

    // Create workflow_executions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS workflow_executions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workspace_id UUID NOT NULL REFERENCES workspaces(id),
            message TEXT NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'pending',
            result TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            completed_at TIMESTAMPTZ
        )",
        &[],
    ).await?;

    // Create indexes
    conn.execute("CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id)", &[]).await?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_workflow_executions_workspace_id ON workflow_executions(workspace_id)", &[]).await?;
    
    Ok(())
}

#[allow(dead_code)]
impl User {
    pub async fn find_by_provider_id(pool: &DbPool, provider_id: &str) -> Result<Option<User>> {
        let conn = pool.get().await?;
        let row = conn.query_opt(
            "SELECT id, email, name, kinde_id as auth_provider_id, created_at FROM users WHERE kinde_id = $1",
            &[&provider_id],
        ).await?;
        
        match row {
            Some(row) => Ok(Some(User::from_row(row))),
            None => Ok(None),
        }
    }

    pub async fn create(pool: &DbPool, email: String, name: String, auth_provider_id: String) -> Result<User> {
        let conn = pool.get().await?;
        let row = conn.query_one(
            "INSERT INTO users (email, name, kinde_id) VALUES ($1, $2, $3) 
             RETURNING id, email, name, kinde_id as auth_provider_id, created_at",
            &[&email, &name, &auth_provider_id],
        ).await?;
        
        Ok(User::from_row(row))
    }

    fn from_row(row: Row) -> Self {
        User {
            id: row.get("id"),
            email: row.get("email"),
            name: row.get("name"),
            auth_provider_id: row.get("auth_provider_id"),
            created_at: row.get("created_at"),
        }
    }
}

impl Workspace {
    pub async fn find_by_user_id(pool: &DbPool, user_id: Uuid) -> Result<Vec<Workspace>> {
        let conn = pool.get().await?;
        let rows = conn.query(
            "SELECT id, name, user_id, created_at, updated_at FROM workspaces WHERE user_id = $1 ORDER BY updated_at DESC",
            &[&user_id],
        ).await?;
        
        Ok(rows.into_iter().map(Workspace::from_row).collect())
    }

    pub async fn create(pool: &DbPool, name: String, user_id: Uuid) -> Result<Workspace> {
        let conn = pool.get().await?;
        let row = conn.query_one(
            "INSERT INTO workspaces (name, user_id) VALUES ($1, $2) 
             RETURNING id, name, user_id, created_at, updated_at",
            &[&name, &user_id],
        ).await?;
        
        Ok(Workspace::from_row(row))
    }

    fn from_row(row: Row) -> Self {
        Workspace {
            id: row.get("id"),
            name: row.get("name"),
            user_id: row.get("user_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }
}
