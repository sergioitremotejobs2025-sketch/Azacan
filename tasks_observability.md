# Observability & Monitoring Tasks

Based on `PROJECT_IMPROVEMENTS.md`, here is the list of pending tasks for Observability & Monitoring:

- [x] **Distributed Tracing**
  - Implement **OpenTelemetry** (with Jaeger or Tempo) to trace requests from the Next.js frontend -> Django backend -> PostgreSQL -> Ollama.
  - *Goal:* Identify latency bottlenecks in the RAG pipeline.

- [ ] **Metrics & Dashboards**
  - Deploy **Prometheus** and **Grafana**.
  - *Goal:* Visualize cluster health, request rates, and custom application metrics (e.g., "AI generation time", "Cache hit ratio", "Vector search latency").

- [ ] **Centralized Logging**
  - Set up **Fluentd** or **Elasticstack (ELK)** to aggregate logs from all pods.
  - *Goal:* Make debugging easier than running `kubectl logs` manually.
