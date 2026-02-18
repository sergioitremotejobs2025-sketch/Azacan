#!/bin/bash
# deploy_cloud.sh
# Complete automation for Libro-Mind deployment to Google Cloud (GKE)

PROJECT_ID="libromind-sergio-1770983773"
REGION="us-central1"
REPO_NAME="libro-mind-repo"
CLUSTER_NAME="libro-mind-cluster"
NAMESPACE="libro-mind"

echo "Step 1: Setting GCP Project..."
gcloud config set project $PROJECT_ID

echo "Step 2: Enabling APIs..."
gcloud services enable \
    container.googleapis.com \
    artifactregistry.googleapis.com \
    compute.googleapis.com \
    iamcredentials.googleapis.com --quiet

echo "Step 3: Ensuring Artifact Registry exists..."
gcloud artifacts repositories describe $REPO_NAME --location=$REGION --quiet || \
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for Libro-Mind" --quiet

echo "Step 4: Authenticating Docker to GCP..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

echo "Step 5: Building and Pushing Images (Backend/Frontend)..."
# Backend
BACKEND_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:test"
docker build -t $BACKEND_TAG -f docker-compose-app/backend.Dockerfile .
docker push $BACKEND_TAG

# Frontend
FRONTEND_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:test"
docker build -t $FRONTEND_TAG -f docker-compose-app/frontend.Dockerfile .
docker push $FRONTEND_TAG

echo "Step 6: Checking GKE Cluster Status..."
CLUSTER_STATUS=$(gcloud container clusters describe $CLUSTER_NAME --region $REGION --format="value(status)" 2>/dev/null || echo "NOT_FOUND")

if [ "$CLUSTER_STATUS" == "NOT_FOUND" ]; then
    echo "Creating GKE cluster (this may take 5-10 mins)..."
    gcloud container clusters create $CLUSTER_NAME \
        --region $REGION \
        --num-nodes 3 \
        --machine-type e2-standard-2 --quiet
else
    echo "Cluster already exists (Status: $CLUSTER_STATUS)."
fi

echo "Step 7: Getting Cluster Credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --quiet

echo "Step 8: Applying Kubernetes Manifests..."
# Apply everything in k8s-manifests-cloud
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s-manifests-cloud/ -n $NAMESPACE

echo "Step 9: Waiting for PostgreSQL..."
kubectl wait --for=condition=Ready pod/postgres-0 -n $NAMESPACE --timeout=300s

echo "Step 10: Automatic Database Import..."
# Check if database is already populated
BOOK_COUNT=$(kubectl exec -n $NAMESPACE postgres-0 -- psql -U postgres -d postgres -t -c "SELECT count(*) FROM recommendations_book;" 2>/dev/null || echo "0")
if [ "$BOOK_COUNT" -lt "100" ]; then
    echo "Database appears empty (count: $BOOK_COUNT). Importing catalog..."
    kubectl cp ecom/book_store_db_backup.sql $NAMESPACE/postgres-0:/tmp/backup.sql
    kubectl exec -n $NAMESPACE postgres-0 -- psql -U postgres -d postgres -f /tmp/backup.sql
    echo "Database import complete."
else
    echo "Database already populated ($BOOK_COUNT books). Skipping import."
fi

echo "Step 11: Finalizing Backend Sync..."
BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n $NAMESPACE $BACKEND_POD -- python manage.py sync_books_to_products &

echo "---------------------------------------------------"
echo "DEPLOYMENT COMPLETE!"
echo "Frontend URL: $(kubectl get svc frontend-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):3000"
echo "Backend Admin: $(kubectl get svc backend-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):8000/admin/"
echo "---------------------------------------------------"
