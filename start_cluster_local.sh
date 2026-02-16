#!/bin/bash

# Libro-Mind Local Cluster Startup Script
# This script automates starting Minikube with sufficient resources and deploying the stack.

set -e

# Ensure common binary paths are included
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}          LIBRO-MIND LOCAL CLUSTER STARTUP          ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Attempting to start Docker Desktop...${NC}"
    open -a Docker
    echo -e "${YELLOW}Waiting for Docker to start (this might take a minute)...${NC}"
    while ! docker info > /dev/null 2>&1; do 
        echo -n "."
        sleep 5
    done
    echo -e "\n${GREEN}Docker is ready!${NC}"
fi

# 1.5 Check for port 80 conflicts (Local Nginx, etc)
if lsof -i :80 > /dev/null 2>&1; then
    NGINX_PID=$(lsof -t -i :80 | head -n 1)
    echo -e "${RED}Error: Port 80 is already in use by another process (PID: $NGINX_PID).${NC}"
    echo -e "${YELLOW}This is likely a local Nginx server. Recommended fix:${NC}"
    echo -e "  ${BLUE}sudo brew services stop nginx${NC} OR ${BLUE}sudo pkill nginx${NC}"
    echo -e "${YELLOW}Attempting to proceed anyway, but Ingress might fail...${NC}"
    sleep 3
fi

# 2. Start Minikube
echo -e "${BLUE}Step 1: Ensuring Minikube is started...${NC}"
if minikube status > /dev/null 2>&1; then
    echo -e "${GREEN}Minikube is already configured.${NC}"
    if ! minikube status | grep -q "Running"; then
    echo -e "${YELLOW}Minikube is stopped. Starting with 7GB RAM and 6 CPUs...${NC}"
    minikube start --memory 7168 --cpus 6 --driver=docker
  fi
else
  echo -e "${YELLOW}Created new Minikube cluster with 7GB RAM and 6 CPUs...${NC}"
  minikube start --memory 7168 --cpus 6 --driver=docker
fi

# 3. Enable Addons
echo -e "${BLUE}Step 2: Enabling Minikube addons (Ingress, Metrics, Dashboard)...${NC}"
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

# 4. Build Images
echo -e "${BLUE}Step 3: Building application images inside Minikube...${NC}"
echo -e "${YELLOW}(This might take 5-10 minutes on the first run as it pulls dependencies)${NC}"

# Build Backend
echo -e "Building ${BLUE}Backend${NC} image..."
minikube image build -t libro-mind-backend:latest -f docker-compose-app/backend.Dockerfile .
echo -e "${GREEN}Backend build complete!${NC}"

# Build Frontend
echo -e "\nBuilding ${BLUE}Frontend${NC} image..."
minikube image build -t libro-mind-frontend:latest -f docker-compose-app/frontend.Dockerfile .
echo -e "${GREEN}Frontend build complete!${NC}"

# 5. Apply Manifests
echo -e "${BLUE}Step 4: Deploying to Kubernetes...${NC}"

# Create namespaces if they don't exist
kubectl create namespace libro-mind --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -

# Retrying apply because sometimes the Ingress Admission Webhook isn't ready immediately
MAX_RETRIES=3
RETRY_COUNT=0
until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
    # Apply all manifests except external-secrets.yaml (which is for GCP)
    echo -e "Applying manifests (attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    SUCCESS=true
    for f in k8s-manifests/*.yaml; do
        if [[ "$(basename "$f")" != "external-secrets.yaml" ]]; then
            if ! kubectl apply -f "$f"; then
                SUCCESS=false
            fi
        fi
    done
    $SUCCESS && break
    
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo -e "${YELLOW}Some manifests failed to apply. Retrying in 10s ($RETRY_COUNT/$MAX_RETRIES)...${NC}"
    sleep 10
done

# 6. Backend Readiness & Data Initialization
echo -e "${BLUE}Step 5: Ensuring Backend is ready & Syncing Data...${NC}"

BACKEND_POD=$(kubectl get pods -n libro-mind -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [[ -z "$BACKEND_POD" ]]; then
    echo -e "${YELLOW}Waiting for Backend deployment to create pods...${NC}"
    sleep 10
    BACKEND_POD=$(kubectl get pods -n libro-mind -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
fi

if [[ -n "$BACKEND_POD" ]]; then
    echo -e "Waiting for ${YELLOW}$BACKEND_POD${NC} to be ready (this includes migrations)..."
    kubectl wait --for=condition=Ready pod/"$BACKEND_POD" -n libro-mind --timeout=300s
fi

# Find Postgres pod
POSTGRES_POD=$(kubectl get pods -n libro-mind -l app=postgres-statefulset -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || kubectl get pods -n libro-mind -l app=postgres -o jsonpath='{.items[0].metadata.name}')

if [[ -z "$POSTGRES_POD" ]]; then
    echo -e "${RED}Error: Could not find Postgres pod.${NC}"
else
    echo -e "Waiting for ${YELLOW}$POSTGRES_POD${NC} to be ready..."
    kubectl wait --for=condition=Ready pod/"$POSTGRES_POD" -n libro-mind --timeout=120s
    
    # Check if books are already imported
    # We use tr -d '[:space:]' to ensure we get a clean number or empty string
    BOOK_COUNT=$(kubectl exec -n libro-mind "$POSTGRES_POD" -- psql -U postgres -d postgres -t -c "SELECT count(*) FROM recommendations_book;" 2>/dev/null | xargs | tr -d '[:space:]' || echo "0")
    
    if [[ "$BOOK_COUNT" == "0" ]] || [[ -z "$BOOK_COUNT" ]]; then
        echo -e "${YELLOW}Database is empty (count: '$BOOK_COUNT'). Importing book catalog (50MB SQL)...${NC}"
        if [ -f "ecom/book_store_db_backup.sql" ]; then
            kubectl cp ecom/book_store_db_backup.sql libro-mind/"$POSTGRES_POD":/tmp/backup.sql
            kubectl exec -n libro-mind "$POSTGRES_POD" -- psql -U postgres -d postgres -f /tmp/backup.sql
            echo -e "${GREEN}Catalog imported successfully.${NC}"
        else
            echo -e "${RED}Warning: ecom/book_store_db_backup.sql not found. Skipping import.${NC}"
        fi
    else
        echo -e "${GREEN}Database already initialized with $BOOK_COUNT books.${NC}"
    fi
fi

# Sync Products and Reindex
echo -e "\n${BLUE}Step 6: Syncing Store Products & Ensuring Models...${NC}"

if [[ -z "$BACKEND_POD" ]]; then
    echo -e "${RED}Error: Could not find Backend pod for sync.${NC}"
else
    echo -e "Running sync_books_to_products..."
    kubectl exec -n libro-mind "$BACKEND_POD" -- python manage.py sync_books_to_products
    
    echo -e "Ensuring Ollama models are pulled..."
    kubectl exec -n libro-mind "$BACKEND_POD" -- python -c "import os; from langchain_ollama import ChatOllama; ChatOllama(model='deepseek-r1:1.5b', base_url=os.getenv('OLLAMA_BASE_URL')).invoke('hi')" > /dev/null 2>&1 || echo "Ollama model is warming up..."
fi

# 7. Bridging Cluster to Local Host
echo -e "${BLUE}Step 7: Bridging Cluster to Local Host...${NC}"
echo -e "${YELLOW}Starting service tunnels for easy accessibility...${NC}"

# 7.1 Start Minikube Tunnel (for Ingress/localhost)
# We run this in the background, but on macOS it needs sudo for port 80.
# We use a non-blocking background process.
minikube tunnel > /tmp/minikube_tunnel.log 2>&1 &
TUNNEL_PID=$!

# 7.2 Start Service Bridges (Fallback for agent/environments without sudo)
# This binds to a random high port on 127.0.0.1, making it reachable even without port 80 access.
echo -e "Starting ${YELLOW}frontend-service${NC} bridge..."
minikube service -n libro-mind frontend-service --url > /tmp/frontend_service.log 2>&1 &
FRONTEND_SERVICE_PID=$!

echo -e "Starting ${YELLOW}backend-service${NC} bridge..."
minikube service -n libro-mind backend-service --url > /tmp/backend_service.log 2>&1 &
BACKEND_SERVICE_PID=$!

# Give them a moment to generate URLs
sleep 5
FRONTEND_URL=$(grep "http://127.0.0.1" /tmp/frontend_service.log | tail -n 1 || echo "")
BACKEND_URL=$(grep "http://127.0.0.1" /tmp/backend_service.log | tail -n 1 || echo "")

if [[ -n "$FRONTEND_URL" ]]; then
    echo -e "${GREEN}Frontend Bridge active at: ${BLUE}$FRONTEND_URL${NC}"
fi
if [[ -n "$BACKEND_URL" ]]; then
    echo -e "${GREEN}Backend Bridge active at:  ${BLUE}$BACKEND_URL${NC}"
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}          STARTUP SEQUENCE COMPLETED!               ${NC}"
echo -e "${GREEN}====================================================${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "1. Access via ${GREEN}Ingress (Recommended)${NC}: ${BLUE}http://localhost${NC} (Requires 'sudo minikube tunnel')"

if [[ -n "$FRONTEND_URL" ]]; then
    echo -e "2. Access ${GREEN}Frontend${NC} via Bridge: ${BLUE}$FRONTEND_URL${NC}"
else
    echo -e "2. Access ${GREEN}Frontend${NC} via Bridge: Run '${YELLOW}minikube service -n libro-mind frontend-service --url${NC}'"
fi

if [[ -n "$BACKEND_URL" ]]; then
    echo -e "3. Access ${GREEN}Backend/Admin${NC} via Bridge: ${BLUE}${BACKEND_URL}/admin/${NC}"
else
    echo -e "3. Access ${GREEN}Backend/Admin${NC} via Bridge: Run '${YELLOW}minikube service -n libro-mind backend-service --url${NC}'"
fi

echo -e "4. Check pod status with: '${YELLOW}kubectl get pods -n libro-mind${NC}'"
echo -e "5. To stop tunnels: '${YELLOW}kill $TUNNEL_PID $FRONTEND_SERVICE_PID $BACKEND_SERVICE_PID${NC}' 2>/dev/null"
echo ""
echo -e "${YELLOW}Note: The Library (/books) will initialize automatically on first load.${NC}"
echo -e "${YELLOW}If localhost is not reachable, use the Service Bridge URLs above.${NC}"
