# Deployment Instructions for AI Agent Workflow MVP

## Prerequisites

1. **Google Cloud SDK**: Install and authenticate with `gcloud auth login`
2. **GCP Project**: Create a project and enable App Engine API
3. **Environment Variables**: Update the placeholders in the deployment configs

## Configuration Steps

### 1. Update Environment Variables

**Backend (`backend/app.yaml`):**
- Replace `your-domain.kinde.com` with your actual Kinde domain
- Replace `your_kinde_client_id_here` with your Kinde Client ID
- Replace `your_kinde_client_secret_here` with your Kinde Client Secret
- Replace `your_openrouter_api_key_here` with your OpenRouter API key
- Replace `your_gcp_project_id_here` with your GCP Project ID

**Frontend (`frontend/app.yaml`):**
- Replace `your_kinde_client_id_here` with your Kinde Client ID  
- Replace `your-domain.kinde.com` with your actual Kinde domain
- Replace `your-gcp-project-id` with your actual GCP Project ID (in the API base URL)
- Replace `your_openrouter_api_key_here` with your OpenRouter API key
- Replace `your_gcp_project_id_here` with your GCP Project ID

### 2. Set GCP Project

```bash
gcloud config set project YOUR_GCP_PROJECT_ID
```

### 3. Deploy Backend

```bash
cd backend
gcloud app deploy app.yaml --version=v1
```

### 4. Deploy Frontend

```bash
cd ../frontend
gcloud app deploy app.yaml --version=v1
```

## Post-Deployment

1. **Update Kinde Settings**: Add your GCP App Engine URLs to Kinde allowed redirect URIs
2. **Test Endpoints**: Verify both services are running:
   - Backend: `https://backend-dot-YOUR_PROJECT_ID.appspot.com/health`
   - Frontend: `https://frontend-dot-YOUR_PROJECT_ID.appspot.com`

## MVP Features Available

✅ **Kinde Authentication**: Signup/login functionality  
✅ **Infinite Canvas**: Excalidraw integration for workspace creation  
✅ **Floating Chat Agent**: Speech-to-text enabled chat interface  
✅ **AI Workflow Orchestration**: Multi-agent system with planner, coder, and reviewer  
✅ **Node Visualization**: Graphical display of AI agent workflow  
✅ **Progress Animations**: Skeleton loading and status indicators  
✅ **Gradient Aesthetic**: Modern UI with animated floating orbs  
✅ **Backend API**: Workspace management and workflow processing endpoints  
✅ **Environment Management**: Secure configuration for all services  

## Next Steps for Production

1. **GCP Secrets Manager**: Implement secure API key storage
2. **ParadeDB Integration**: Connect to actual database instead of in-memory storage
3. **OpenRouter Integration**: Connect to real AI models via OpenRouter API
4. **Container Orchestration**: Set up GCP container allocation for AI workflows
5. **Error Handling**: Enhanced fallback logic for AI agent failures
6. **Monitoring**: Add logging and health monitoring
7. **Performance**: Implement caching and optimize bundle size
