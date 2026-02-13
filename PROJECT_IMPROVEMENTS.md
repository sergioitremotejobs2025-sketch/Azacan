# Roadmap for Improvements: Libro-Mind Project

This document outlines potential areas for enhancement to elevate the project's architecture, reliability, and feature set. These improvements demonstrate advanced engineering practices suitable for a senior-level portfolio.

## 1. DevOps & Infrastructure (Kubernetes & Cloud)

- **Horizontal Pod Autoscaling (HPA):**
  - Implement HPA for `backend` and `frontend` deployments based on CPU/Memory utilization to handle traffic spikes automatically.
  - *Current State:* Static replica counts in manifests.

- **Infrastructure as Code (IaC):**
  - Migrate manual `kubectl apply` workflows to **Terraform** or **OpenTofu**. This ensures the entire GCP/Kubernetes infrastructure (clusters, networks, permissions) is reproducible and version-controlled.

- **Helm Charts:**
  - Package the application manifests into a **Helm Chart**. This simplifies deployment across different environments (dev, staging, prod) using `values.yaml` files instead of duplicating YAML manifests.

- **Service Mesh (Optional but impressive):**
  - Integrate **Istio** or **Linkerd** for advanced traffic management (canary deployments), mutual TLS (mTLS) security between services, and deeper observability.

## 2. Observability & Monitoring

- **Distributed Tracing:**
  - Implement **OpenTelemetry** (with Jaeger or Tempo) to trace requests from the Next.js frontend -> Django backend -> PostgreSQL -> Ollama. This helps identify latency bottlenecks in the RAG pipeline.

- **Metrics & Dashboards:**
  - Deploy **Prometheus** and **Grafana** to visualize cluster health, request rates, and custom application metrics (e.g., "AI generation time", "Cache hit ratio", "Vector search latency").

- **Centralized Logging:**
  - Set up **Fluentd** or **Elasticstack (ELK)** to aggregate logs from all pods, making debugging easier than running `kubectl logs` manually.

## 3. Backend & AI Architecture

- **Advanced RAG Techniques:**
  - **Re-ranking:** Implement a cross-encoder model (e.g., `BAAI/bge-reranker`) to re-rank the top-K results from the vector search before sending them to the LLM, improving relevance.
  - **HyDE (Hypothetical Document Embeddings):** Generate a hypothetical answer first, embed that, and search against it to improve semantic matching for complex queries.
  - **Query Expansion:** Use the LLM to generate synonyms or related questions to broaden the search scope.

- **Asynchronous Processing:**
  - Offload heavy tasks (like generating vector embeddings for new bulk book uploads or sending emails) to a task queue like **Celery** with **Redis** or **RabbitMQ**.

- **API Gateway:**
  - Introduce an API Gateway (like **Kong** or K8s Ingress Controller with more rules) to handle rate limiting, authentication, and request validation at the edge.

## 4. Frontend & User Experience

- **End-to-End (E2E) Testing:**
  - Add **Playwright** or **Cypress** tests to verify critical user flows (e.g., "Search for a book -> Add to Cart -> Checkout") automatically in the CI/CD pipeline.

- **Optimistic UI Updates:**
  - Implement optimistic updates in React Query/SWR for the "Add to Cart" action to make the interface feel instantly responsive, dealing with errors in the background.

- **Feedback Loop Integration:**
  - Add a "Thumbs Up/Down" mechanism for AI recommendations. Log this feedback to the database to evaluate model performance and potentially fine-tune future models (RLHF groundwork).

## 5. Security

- **Secrets Management:**
  - Migrate from standard Kubernetes Secrets to an external manager like **Google Secret Manager** or **HashiCorp Vault**, injected via CSI drivers for better security and rotation capabilities.

- **Network Policies:**
  - Define Kubernetes `NetworkPolicies` to strictly limit communication (e.g., only the Backend can talk to the Database; Frontend cannot talk directly to the Database).

- **Container Security Scanning:**
  - Implement **Trivy** or **Grype** in the CI pipeline to scan Docker images for vulnerabilities (CVEs) before deployment.
