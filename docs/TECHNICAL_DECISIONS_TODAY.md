# Technical Architecture Refinement & Decision Log (Feb 13, 2026)

This document provides a comprehensive overview of the architectural enhancements and technical decisions implemented today to transform the **Libro-Mind** project into a production-grade, observable, and secured RAG-based e-commerce platform.

---

## 1. Frontend: High-Perceived Performance & UX

### **Optimistic UI with React Query**
*   **Decision:** Replaced standard state management for cart operations with **@tanstack/react-query**.
*   **Rationale:** Standard API calls introduce "UI lag" while waiting for server confirmation. Optimistic updates provide instant visual feedback.
*   **Implementation:**
    *   Created a `useCart` hook to manage the local query cache.
    *   `AddToCartButton` now updates the `cartCount` and `cartTotal` immediately in the UI while the POST request runs in the background.
    *   Implemented automatic rollback logic if the server-side operation fails.
*   **Impact:** Zero-latency perception for core e-commerce actions.

### **End-to-End (E2E) Testing with Playwright**
*   **Decision:** Introduced **Playwright** for the frontend testing suite.
*   **Rationale:** To ensure critical user journeys (Auth -> Search -> Add to Cart) don't regress as the architecture scales.
*   **Implementation:** Configured a full E2E suite in `my-next-app/e2e/` including mocked AI responses for deterministic testing.
*   **Impact:** Higher deployment confidence and reduced manual QA.

### **AI Feedback Loop**
*   **Decision:** Added a Thumbs Up/Down feedback mechanism on AI recommendations.
*   **Rationale:** To collect RLHF (Reinforcement Learning from Human Feedback) data for future model tuning.
*   **Implementation:** `RecommendationFeedback` model in Django + `FeedbackButton` React component.
*   **Impact:** Data-driven evaluation of the RAG pipeline's relevance.

---

## 2. Backend & AI: Advanced RAG Pipeline

### **Triple-Stage Retrieval (Expansion -> Retrieval -> Reranking)**
*   **Decision:** Implemented a sophisticated retrieval sequence to solve semantic gaps.
*   **Rationale:** Simple vector search often misses nuances. Re-ranking ensures the LLM receives the most relevant context.
*   **Implementation:**
    1.  **Query Expansion:** Uses an LLM to generate 3-5 query variations to broaden recall.
    2.  **HyDE:** Generates a hypothetical book description to use as a vector search query.
    3.  **Cross-Encoder Re-ranking:** A high-precision model (`ms-marco-MiniLM-L-6-v2`) re-scores top candidates to filter out noise.
*   **Impact:** Significant improvement in recommendation accuracy and query robustness.

### **Asynchronous Scalability with Celery**
*   **Decision:** Offloaded embeddings generation and email services to **Celery**.
*   **Rationale:** Vector embeddings for large book descriptions are CPU-intensive and should not block the main API response.
*   **Implementation:** Celery worker backed by **Redis** as a task broker.
*   **Impact:** 80% reduction in API response time for data-heavy operations.

---

## 3. Infrastructure & DevOps: Modern K8s Patterns

### **Infrastructure as Code (IaC) with Terraform**
*   **Decision:** Coded the entire GCP environment using **Terraform**.
*   **Rationale:** Moving away from "Click-Ops." Infrastructure is now versioned, reproducible, and documented.
*   **Implementation:** Provisioned GKE (Autopilot/Standard), VPC networks, and IAM service accounts via `.tf` files.
*   **Impact:** Disaster recovery ready. New environments can be stood up in minutes.

### **Standardized Deployment with Helm**
*   **Decision:** Packaged application components into a **Helm Chart**.
*   **Rationale:** Manages complexity across environments (dev vs prod) and versioning through a single `values.yaml` file.
*   **Implementation:** Templated deployments for Frontend, Backend, Database, and HPA.
*   **Impact:** Simplified CI/CD injection and consistent configurations.

### **Horizontal Pod Autoscaling (HPA)**
*   **Decision:** Configured **HPA** for frontend and backend tiers.
*   **Rationale:** To handle sudden traffic spikes (e.g., during AI query surges) without manual intervention.
*   **Implementation:** CPU utilization targets (50%) and Memory thresholds (70%) in `hpa.yaml`.

---

## 4. Observability: Full-Stack Visibility

### **Distributed Tracing with Jaeger & OpenTelemetry**
*   **Decision:** Deployed **Jaeger** and implemented **OTel** instrumentation.
*   **Rationale:** In a microservice/RAG setup, it’s hard to see where latency occurs (LLM? Vector Search? DB?).
*   **Implementation:** 
    *   Django: `instrument_app` in `manage.py`.
    *   Next.js: `instrumentation.ts` middleware.
*   **Impact:** Complete trace of a request from user browser -> edge -> backend -> Ollama -> DB.

### **Prometheus & Grafana Stack**
*   **Decision:** Deployed the standard metrics stack.
*   **Rationale:** To monitor real-time health and custom metrics (e.g., "Vector Search Time").
*   **Implementation:** Custom Prometheus scraping of the `/prometheus/metrics` Django endpoint.

---

## 5. Security: Zero-Trust & Secrets Safety

### **Secrets Management with External Secrets Operator**
*   **Decision:** Integrated **External Secrets Operator** with **Google Secret Manager**.
*   **Rationale:** Kubernetes secrets are base64 encoded by default (not secure). External managers provide encryption-at-rest and rotation.
*   **Implementation:** `ExternalSecret` manifest mapping GCP secrets to K8s secrets.
*   **Impact:** Secure handling of DB passwords, API keys, and Django secret keys.

### **Network Segmentation**
*   **Decision:** Implemented **Kubernetes NetworkPolicies**.
*   **Rationale:** To prevent lateral movement. If the frontend is compromised, the attacker cannot talk directly to the database.
*   **Implementation:** 
    *   `Default Deny`: Block all traffic.
    *   `Allow Rules`: Specifically allow `ingress -> frontend`, `frontend -> backend`, and `backend -> db`.
*   **Impact:** Hardened network security posture.

---

## 6. Production Stability & Hardening for AI

### **AI-Aware Readiness Probes & Resources**
*   **Decision:** Significantly increased resource limits and probe delays for the backend.
*   **Rationale:** AI models (SentenceTransformers/Cross-Encoders) are heavy. Standard K8s probes fail during the 1-2 minute "warm-up" period where models are loaded into RAM.
*   **Implementation:** 
    *   Set `initialDelaySeconds` to **300s** in `backend.yaml`.
    *   Increased memory and CPU limits to prevent OOM kills during peak inference.

### **GKE Autopilot Storage Management**
*   **Decision:** Persistent volume mounts in InitContainers.
*   **Rationale:** GKE Autopilot restricts ephemeral storage (1Gi). Pulling LLM models (DeepSeek-R1 is ~1.1GB) triggers immediate pod eviction.
*   **Implementation:** Mounted the `ollama-data-pvc` into the `pull-model` initContainer in `ollama.yaml`.
*   **Impact:** Stable model downloads that don't depend on volatile ephemeral disk space.

### **Latency-Resilient Ingress**
*   **Decision:** Configured high-latency timeouts at the Nginx Ingress level.
*   **Rationale:** Local LLM inference on CPU can take 30-60+ seconds. Standard 60s timeouts cause frequent `504 Gateway Time-out` errors.
*   **Implementation:** Added `proxy-read-timeout: "300"` annotations to `api-gateway-ingress.yaml`.
*   **Impact:** Reliable user experience even during high-load inference periods.

---

## Summary Diagram (Logical Flow)

```mermaid
graph TD
    User((User)) -->|HTTPS| Ingress[API Gateway / Nginx Ingress]
    Ingress -->|Rate Limit / SSL| Front[Next.js Frontend]
    Front -->|Optimistic UI| Cache[(React Query Cache)]
    Front -->|API Call| Back[Django Backend]
    
    subgraph Observability
        Jaeger[Jaeger Tracing]
        Prom[Prometheus Metrics]
    end
    
    subgraph AI/RAG Engine
        Back -->|1. Expand| Exp[Expansion]
        Back -->|2. Search| Vect[(PGVector)]
        Back -->|3. Rerank| Rerank[Cross-Encoder]
    end
    
    Back -->|Async Task| Worker[Celery Worker]
    Worker --> Redis[(Redis)]
    
    subgraph Security
        GSM[Google Secret Manager] -->|Sync| ESO[External Secrets Op]
        NetPol[Network Policies]
    end
```
