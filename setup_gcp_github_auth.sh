#!/bin/bash
# setup_gcp_github_auth.sh
# This script configures GCP Workload Identity Federation for your GitHub repository.

PROJECT_ID="libromind-sergio-1770983773"
REPO="sergioitremotejobs2025-sketch/Azacan"
SERVICE_ACCOUNT_NAME="libro-mind-app-sa"
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"

echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

echo "Enabling required APIs..."
gcloud services enable iamcredentials.googleapis.com \
    sts.googleapis.com \
    iam.googleapis.com

# Create the Workload Identity Pool if it doesn't exist
echo "Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create "$POOL_NAME" \
    --location="global" \
    --display-name="GitHub Actions Pool" || true

# Get the Pool ID
POOL_ID=$(gcloud iam workload-identity-pools describe "$POOL_NAME" \
    --location="global" --format='value(name)')

# Create the Workload Identity Provider if it doesn't exist
echo "Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
    --location="global" \
    --workload-identity-pool="$POOL_NAME" \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com" || true

# Get the Provider ID
PROVIDER_ID=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
    --location="global" \
    --workload-identity-pool="$POOL_NAME" \
    --format='value(name)')

# Create the Service Account if it doesn't exist (though Terraform might do this)
echo "Ensuring Service Account exists..."
gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --display-name="App Deployment Service Account" || true

SA_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# Allow GitHub to act as the Service Account
echo "Binding GitHub Repo to Service Account..."
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
    --project="$PROJECT_ID" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${REPO}"

# Update GitHub Secrets
echo "Updating GitHub Secrets..."
gh secret set GCP_PROJECT_ID --body "$PROJECT_ID"
gh secret set GCP_SERVICE_ACCOUNT --body "$SA_EMAIL"
gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --body "$PROVIDER_ID"

echo "---------------------------------------------------"
echo "Success! Workload Identity Federation is configured."
echo "Project ID: $PROJECT_ID"
echo "Service Account: $SA_EMAIL"
echo "Workload Identity Provider: $PROVIDER_ID"
echo "---------------------------------------------------"
