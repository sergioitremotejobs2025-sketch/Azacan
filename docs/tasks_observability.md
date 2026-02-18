# Observability & Monitoring Tasks

Based on `PROJECT_IMPROVEMENTS.md`, here is the list of pending tasks for Observability & Monitoring:

- [ ] **Distributed Tracing**
  - [ ] Deploy **Jaeger** (all-in-one) to the Kubernetes cluster.
  - [ ] Ensure `frontend` (Next.js) and `backend` (Django) are configured to send traces to Jaeger.
  - *Goal:* Trace requests from Frontend -> Backend -> Database/AI.

- [ ] **Metrics & Dashboards**
  - [ ] Deploy **Prometheus** to scrape metrics from the application and cluster.
  - [ ] Deploy **Grafana** and configure it to use Prometheus as a data source.
  - [ ] Import/Create a dashboard to visualize request rates, latency, and system resources.
  - *Goal:* Visualize cluster health and application performance.

- [ ] **Centralized Logging**
  - [ ] Deploy **Fluentd** (or similar) as a DaemonSet to collect logs.
  - [ ] (Optional for this scope) Forward logs to Elasticsearch/Loki or just ensure robust stdout capture.
  - *Goal:* Aggregate logs for easier debugging.
