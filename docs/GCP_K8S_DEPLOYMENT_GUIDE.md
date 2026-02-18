# Deploying Libro-Mind to Google Kubernetes Engine (GKE)

This guide provides the steps to move your local Kubernetes configuration from Minikube to a production-ready environment on **Google Cloud Platform (GCP)**.

---

## 1. Prerequisites

Before you begin, ensure you have:
1.  A **Google Cloud Account** with billing enabled.
2.  **Google Cloud CLI (`gcloud`)** installed and authenticated:
    ```bash
    gcloud auth login
    gcloud auth application-default login
    ```
3.  **Docker** running locally to build and push images.
4.  The `kubectl` command-line tool.

---

## 2. Infrastructure Setup

### A. Set Global Variables
Replace `PROJECT_ID` with your actual GCP project ID and choose a region (e.g., `us-central1`).
```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export REPO_NAME="libro-mind-repo"
export CLUSTER_NAME="libro-mind-cluster"

gcloud config set project $PROJECT_ID
```

### B. Enable Required APIs
```bash
gcloud services enable \
    container.googleapis.com \
    artifactregistry.googleapis.com \
    compute.googleapis.com
```

### C. Create Artifact Registry
GKE needs a place to pull your custom images from.
```bash
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for Libro-Mind"
```

---

## 3. Build and Push Images

Instead of building into Minikube, we build and push to Google's Registry.

### A. Authenticate Docker to GCP
```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### B. Build and Push Backend
```bash
# Tag format: [REGION]-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/[IMAGE_NAME]:[TAG]
export BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:v12"

docker build -t $BACKEND_IMAGE -f docker-compose-app/backend.Dockerfile .
docker push $BACKEND_IMAGE
```

### C. Build and Push Frontend
```bash
export FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:v4"

docker build -t $FRONTEND_IMAGE -f docker-compose-app/frontend.Dockerfile .
docker push $FRONTEND_IMAGE
```

---

## 4. Create the GKE Cluster

Run this command to create a standard 3-node cluster.
```bash
gcloud container clusters create $CLUSTER_NAME \
    --region $REGION \
    --num-nodes 3 \
    --machine-type e2-medium
```

**Get Cluster Credentials:**
```bash
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION
```

---

## 5. Prepare Manifests for GKE

You must update your local YAML files to point to the new Google Cloud images.

### A. Update `k8s-manifests/backend.yaml`
Change the image line (approx. line 30):
```yaml
image: us-central1-docker.pkg.dev/your-project-id/libro-mind-repo/backend:v12
imagePullPolicy: IfNotPresent # Change from Never
```

### B. Update `k8s-manifests/frontend.yaml`
Change the image line:
```yaml
image: us-central1-docker.pkg.dev/your-project-id/libro-mind-repo/frontend:v4
imagePullPolicy: IfNotPresent # Change from Never
```

---

## 6. Deploy the Application

### A. Create Namespace and Secrets
```bash
kubectl create namespace libro-mind

# Re-create secrets on the cloud cluster
kubectl create secret generic libro-mind-secrets \
    --from-literal=POSTGRES_PASSWORD=your_secure_password \
    -n libro-mind
```

### B. Apply Manifests
Deploy everything in the correct order:
```bash
# Apply ConfigMaps first
kubectl apply -f k8s-manifests/config.yaml -n libro-mind

# Apply Database and Services
kubectl apply -f k8s-manifests/db.yaml -n libro-mind
kubectl apply -f k8s-manifests/ollama.yaml -n libro-mind
kubectl apply -f k8s-manifests/json-server.yaml -n libro-mind

# Deploy Backend and Frontend
kubectl apply -f k8s-manifests/backend.yaml -n libro-mind
kubectl apply -f k8s-manifests/frontend.yaml -n libro-mind

# Run DB initialization if needed
kubectl apply -f k8s-manifests/db-init.yaml -n libro-mind
```

---

## 7. Access the Application

In GCP, `Type: LoadBalancer` automatically creates a **Google Cloud Load Balancer** with a public IP.

1.  **Wait for Public IP**:
    ```bash
    kubectl get svc frontend-service -n libro-mind -w
    ```
2.  Once the `EXTERNAL-IP` changes from `<pending>` to an address (e.g., `34.x.x.x`), you can access the app at `http://[EXTERNAL-IP]:3000`.

---

## 8. Cleaning Up
To avoid ongoing charges, delete the cluster when finished:
```bash
gcloud container clusters delete $CLUSTER_NAME --region $REGION
```
