# How to Run and Access Libro-Mind on Kubernetes

This guide provides step-by-step instructions to launch the local Kubernetes cluster and access both the frontend and backend services.

---

## 1. Start the Environment

### A. Start Docker Desktop
Ensure Docker Desktop is open and the engine is running.

### B. Start Minikube
Open your terminal and run:
```bash
minikube start
```

---

## 2. Deploy the Application
If you haven't deployed the manifests yet, or if you've made changes:
```bash
# Create the namespace (if it doesn't exist)
kubectl create namespace libro-mind --dry-run=client -o yaml | kubectl apply -f -

# Apply all manifests
kubectl apply -f k8s-manifests/ -n libro-mind

### Updating with Latest Changes
If you've modified the code and want to see changes in the cluster:
```bash
# 1. Build new images directly into minikube
minikube image build -t libro-mind-backend:v12 -f docker-compose-app/backend.Dockerfile .
minikube image build -t libro-mind-frontend:v4 -f docker-compose-app/frontend.Dockerfile .

# 2. Update the manifests in k8s-manifests/ with the new version tags (e.g. v12, v4)

# 3. Apply the updated manifests
kubectl apply -f k8s-manifests/ -n libro-mind
```
```

---

## 3. Access the Frontend
The frontend is exposed as a `LoadBalancer` service. To get an accessible URL on macOS:

```bash
minikube service frontend-service -n libro-mind
```
*This will open your browser automatically to the correct local address (e.g., `http://127.0.0.1:50664`). Keep this terminal window open to maintain the connection.*

---

## 4. Access the Backend
The backend is internally assigned a `ClusterIP`. You have two ways to reach it:

### Option A: Port Forwarding (Recommended for Testing)
Run this command to map the backend to your `localhost:8000`:
```bash
kubectl port-forward -n libro-mind service/backend-service 8000:8000
```
- **Base URL:** `http://localhost:8000/`
- **Django Admin:** `http://localhost:8000/admin/`

### Option B: Permanent access via Minikube
Change the service type to LoadBalancer and let Minikube open it:
```bash
kubectl patch svc backend-service -n libro-mind -p '{"spec": {"type": "LoadBalancer"}}'
minikube service backend-service -n libro-mind
```

---

## 5. Management Commands

### Create a Django Superuser
To log into the Django Admin, run:
```bash
kubectl exec -it -n libro-mind deployment/backend -- python manage.py createsuperuser
```

### Check Logs
If something isn't working, view the live logs:
```bash
# Backend Logs
kubectl logs -n libro-mind deployment/backend -f

# Frontend Logs
kubectl logs -n libro-mind deployment/frontend -f
```

### Check Overall Status
```bash
kubectl get all -n libro-mind
```

---
*Created on 2026-02-12*
