# 📚 Libro-Mind Project Documentation

Welcome to the comprehensive documentation for **Libro-Mind**, an AI-Powered Bibliographic Discovery engine.

## 🌟 Overview
Libro-Mind is built on a modular microservices architecture, leveraging Retrieval-Augmented Generation (RAG), Semantic Search, and Large Language Models (LLMs) to provide dynamic, personalized book recommendations.

## 🏗️ Architecture & Components
The system is divided into five specialized microservices to ensure scalability and separation of concerns:

1. **Next.js Frontend (`frontend`)**: A modern React-based user interface running on Node.js 20. It handles real-time streaming of AI responses and provides the visual layer.
2. **Django Backend (`backend`)**: The core API gateway and orchestrator running Python 3.11. It manages the RAG pipeline, re-ranking logic, and communicates with the database and AI service.
3. **PostgreSQL Database (`postgres`)**: The persistent storage layer utilizing the `pgvector` extension. It houses over 9,800 book embeddings for rapid semantic retrieval.
4. **Ollama AI Service (`ollama`)**: A dedicated container running local LLM inference models (like `deepseek-r1:1.5b`) to generate natural language reasoning for recommendations.
5. **JSON-Server (`json-server`)**: A lightweight mock backend used for rapid prototyping of user profiles and authentication state.

## 🚀 Deployment Guide

### Local Development (Minikube)
We use a custom bash script to automate local Kubernetes cluster creation, image building, and deployment.

**Steps:**
1. Ensure Docker Desktop is running.
2. Execute the local deployment script:
   ```bash
   ./start_cluster_local.sh
   ```
3. The script will automatically:
   - Start a Minikube cluster with 7GB RAM and 6 CPUs.
   - Build the backend and frontend Docker images directly inside Minikube.
   - Apply all Kubernetes manifests (`k8s-manifests/*.yaml`).
   - Seed the PostgreSQL database with the 50MB book catalog.
   - Setup fixed `kubectl port-forward` tunnels for reliable local access.

**Access Points:**
- **Frontend App**: `http://127.0.0.1:3000`
- **Backend/Admin API**: `http://127.0.0.1:8000`

### Cloud Deployment (Google Kubernetes Engine)
For production, the project utilizes Terraform and Google Cloud Shell scripts.
- Run `./deploy_cloud.sh` to provision a 3-node GKE cluster, setup Workload Identity, and deploy the manifests to the public internet via a LoadBalancer.

---

## 🔧 Troubleshooting & Known Issues

During development and testing, you may encounter the following common issues. Here is how they are resolved:

### 1. `psycopg2.OperationalError: FATAL: could not write init file`
**Cause:** Your Minikube virtual machine or Docker Desktop has run completely out of disk space (`No space left on device`). This happens due to the large size of the Ollama AI models and the PostgreSQL vector database.
**Fix:** Prune unused Docker images to free up space, or increase your Docker Desktop virtual disk limit.
```bash
docker exec minikube docker system prune -a -f
kubectl rollout restart deployment backend -n libro-mind
```

### 2. Frontend Error: `timed out` during AI Search
**Cause:** Running LLM inference (like DeepSeek) locally on a laptop CPU is extremely slow (approx. 0.18 tokens per second). The Next.js frontend or the Django server will time out if the AI takes longer than 30-60 seconds to generate a response.
**Fix:** The Django backend caches search queries persistently in the database (`SearchQueryCache`). If a search times out, wait 1-2 minutes for the backend to finish the generation in the background. The next time you execute the exact same search, it will hit the database cache and return instantly.

### 3. Port Mismatch / Broken Backend Links
**Cause:** Previously, using `minikube service` assigned a random, rotating port to the backend on every restart, breaking hardcoded frontend links.
**Fix:** The `start_cluster_local.sh` script has been updated to use `kubectl port-forward` to strictly bind the frontend to `3000` and the backend to `8000`. Ensure you use the updated script to prevent link breakages.

### 4. Missing CSS / Broken Page Styling
**Cause:** The Django templates (e.g., `product.html`) rely on a missing `styles.css` file.
**Fix:** `base.html` has been patched to pull the required Bootstrap CSS directly from a remote CDN (`https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css`), ensuring styles render correctly regardless of local static file configuration.
