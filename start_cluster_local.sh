#!/bin/bash

# Libro-Mind Local Cluster Startup Script
# This script automates starting Minikube with sufficient resources and deploying the stack.

set -e

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

# 2. Start Minikube
echo -e "${BLUE}Step 1: Ensuring Minikube is started...${NC}"
if minikube status > /dev/null 2>&1; then
    echo -e "${GREEN}Minikube is already configured.${NC}"
    if ! minikube status | grep -q "Running"; then
        echo -e "${YELLOW}Minikube is stopped. Starting...${NC}"
        minikube start
    fi
else
    echo -e "${YELLOW}Created new Minikube cluster with 6GB RAM and 4 CPUs...${NC}"
    minikube start --memory 6144 --cpus 4 --driver=docker
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
echo -n "Building Backend... "
minikube image build -t libro-mind-backend:latest -f docker-compose-app/backend.Dockerfile . > /dev/null
echo -e "${GREEN}Done!${NC}"

# Build Frontend
echo -n "Building Frontend... "
minikube image build -t libro-mind-frontend:latest -f docker-compose-app/frontend.Dockerfile . > /dev/null
echo -e "${GREEN}Done!${NC}"

# 5. Apply Manifests
echo -e "${BLUE}Step 4: Deploying to Kubernetes (namespace: libro-mind)...${NC}"
kubectl create namespace libro-mind --dry-run=client -o yaml | kubectl apply -f -

# Retrying apply because sometimes the Ingress Admission Webhook isn't ready immediately
MAX_RETRIES=3
RETRY_COUNT=0
until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
    kubectl apply -f k8s-manifests/ -n libro-mind && break
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo -e "${YELLOW}Some manifests failed to apply. Retrying in 10s ($RETRY_COUNT/$MAX_RETRIES)...${NC}"
    sleep 10
done

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}          STARTUP SEQUENCE COMPLETED!               ${NC}"
echo -e "${GREEN}====================================================${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "1. Run '${YELLOW}minikube tunnel${NC}' in a separate terminal to enable local access."
echo -e "2. Access the ${GREEN}Frontend${NC} at: http://localhost"
echo -e "3. Access the ${GREEN}Django Admin${NC} at: http://localhost/admin/"
echo -e "4. Check pod status with: '${YELLOW}kubectl get pods -n libro-mind${NC}'"
echo ""
echo -e "${YELLOW}Note: AI models (Ollama) will take a few minutes to pull and start.${NC}"
