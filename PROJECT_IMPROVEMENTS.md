# Roadmap for Improvements: Libro-Mind Project

This document outlines potential areas for enhancement to elevate the project's architecture, reliability, and feature set. These improvements demonstrate advanced engineering practices suitable for a senior-level portfolio.

## 1. DevOps & Infrastructure (Kubernetes & Cloud)

- **Horizontal Pod Autoscaling (HPA):** [COMPLETED]
  - Implement HPA for `backend` and `frontend` deployments based on CPU/Memory utilization to handle traffic spikes automatically.
  - *Current State:* Manifsts created in `k8s-manifests/hpa.yaml`.

- **Infrastructure as Code (IaC):** [COMPLETED]
  - Migrate manual `kubectl apply` workflows to **Terraform** or **OpenTofu**. This ensures the entire GCP/Kubernetes infrastructure (clusters, networks, permissions) is reproducible and version-controlled.
  - *Implementation:* Created Terraform configuration in `terraform/` directory.

- **Helm Charts:** [COMPLETED]
  - Package the application manifests into a **Helm Chart**. This simplifies deployment across different environments (dev, staging, prod) using `values.yaml` files instead of duplicating YAML manifests.
  - *Implementation:* Created chart in `helm-chart/` directory.

- **Service Mesh (Optional but impressive):**
  - Integrate **Istio** or **Linkerd** for advanced traffic management (canary deployments), mutual TLS (mTLS) security between services, and deeper observability.

## 2. Observability & Monitoring

- **Distributed Tracing:** [COMPLETED]
  - Implement **OpenTelemetry** (with Jaeger or Tempo) to trace requests from the Next.js frontend -> Django backend -> PostgreSQL -> Ollama. This helps identify latency bottlenecks in the RAG pipeline.
  - *Implementation:* Created `k8s-manifests/jaeger.yaml` and verified instrumentation.

- **Metrics & Dashboards:** [COMPLETED]
  - Deploy **Prometheus** and **Grafana** to visualize cluster health, request rates, and custom application metrics (e.g., "AI generation time", "Cache hit ratio", "Vector search latency").
  - *Implementation:* Created `k8s-manifests/prometheus.yaml` (metrics scraping) and `k8s-manifests/grafana.yaml` (visualization).

- **Centralized Logging:** [COMPLETED]
  - Set up **Fluentd** or **Elasticstack (ELK)** to aggregate logs from all pods, making debugging easier than running `kubectl logs` manually.
  - *Implementation:* Created `k8s-manifests/fluentd.yaml`.

## 3. Backend & AI Architecture

- **Advanced RAG Techniques:** [COMPLETED]
  - **Re-ranking:** Implement a cross-encoder model (e.g., `BAAI/bge-reranker`) to re-rank the top-K results from the vector search before sending them to the LLM, improving relevance.
  - **HyDE (Hypothetical Document Embeddings):** Generate a hypothetical answer first, embed that, and search against it to improve semantic matching for complex queries.
  - **Query Expansion:** Use the LLM to generate synonyms or related questions to broaden the search scope.
  - *Implementation:* Integrated re-ranking in `rag.py`, HyDE in `hyde.py`, and query expansion in `expansion.py`.

- **Asynchronous Processing:** [COMPLETED]
  - Offload heavy tasks (like generating vector embeddings for new bulk book uploads or sending emails) to a task queue like **Celery** with **Redis** or **RabbitMQ**.
  - *Implementation:* Celery configured in `celery.py` and `settings.py`. Background tasks for embeddings and emails implemented in `tasks.py`.

- **API Gateway:** [COMPLETED]
  - Introduce an API Gateway (like **Kong** or K8s Ingress Controller with more rules) to handle rate limiting, authentication, and request validation at the edge.
  - *Implementation:* Created `k8s-manifests/api-gateway-ingress.yaml` with Nginx Ingress annotations for Rate Limiting and security headers.

## 4. Frontend & User Experience

- **End-to-End (E2E) Testing:** [COMPLETED]
  - Add **Playwright** or **Cypress** tests to verify critical user flows (e.g., "Search for a book -> Add to Cart -> Checkout") automatically in the CI/CD pipeline.
  - *Implementation:* Added Playwright tests in `my-next-app/e2e/`.

- **Optimistic UI Updates:** [COMPLETED]
  - Implement optimistic updates in React Query/SWR for the "Add to Cart" action to make the interface feel instantly responsive, dealing with errors in the background.
  - *Implementation:* Implemented `useCart` hook and `AddToCartButton` with optimistic updates.

- **Feedback Loop Integration:** [COMPLETED]
  - Add a "Thumbs Up/Down" mechanism for AI recommendations. Log this feedback to the database to evaluate model performance and potentially fine-tune future models (RLHF groundwork).
  - *Implementation:* Added feedback backend model/API and frontend components.

## 5. Security

- **Secrets Management:** [COMPLETED]
  - Migrate from standard Kubernetes Secrets to an external manager like **Google Secret Manager** or **HashiCorp Vault**, injected via CSI drivers for better security and rotation capabilities.
  - *Implementation:* Created `k8s-manifests/external-secrets.yaml` for External Secrets Operator.

- **Network Policies:** [COMPLETED]
  - Define Kubernetes `NetworkPolicies` to strictly limit communication (e.g., only the Backend can talk to the Database; Frontend cannot talk directly to the Database).
  - *Implementation:* Created `k8s-manifests/network-policies.yaml` implementing default deny and specific allows.

- **Container Security Scanning:** [COMPLETED]
  - Implement **Trivy** or **Grype** in the CI pipeline to scan Docker images for vulnerabilities (CVEs) before deployment.
  - *Implementation:* Updated `.github/workflows/google.yml` to include Trivy image scan. `k8s-security.yml` already handles IaC scanning.
