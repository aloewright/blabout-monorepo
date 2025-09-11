#!/bin/bash

# Deploy to Google Cloud Run Script
# Usage: ./deploy-to-cloud-run.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="blabout-frontend"

echo "🚀 Deploying to Google Cloud Run..."
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Set the project
gcloud config set project $PROJECT_ID

# Build and submit using Cloud Build
echo "📦 Building with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)'

echo ""
echo "🔧 To set environment variables for production:"
echo "gcloud run services update $SERVICE_NAME --region=$REGION \\"
echo "  --set-env-vars REACT_APP_KINDE_REDIRECT_URI=https://blabout.com/auth/callback,\\"
echo "  REACT_APP_KINDE_POST_LOGOUT_REDIRECT_URL=https://blabout.com,\\"
echo "  REACT_APP_KINDE_POST_LOGIN_REDIRECT_URL=https://blabout.com,\\"
echo "  REACT_APP_API_BASE_URL=https://api.blabout.com"
