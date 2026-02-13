# Observability & Monitoring Tasks

Based on `PROJECT_IMPROVEMENTS.md`, here is the list of pending tasks for Observability & Monitoring:

- [x] **Distributed Tracing**
  - Implement **OpenTelemetry** (with Jaeger or Tempo) to trace requests from the Next.js frontend -> Django backend -> PostgreSQL -> Ollama.
  - *Goal:* Identify latency bottlenecks in the RAG pipeline.

- [x] **Metrics & Dashboards**
  - Deploy **Prometheus** and **Grafana**.
  - *Goal:* Visualize cluster health, request rates, and custom application metrics (e.g., "AI generation time", "Cache hit ratio", "Vector search latency").

- [x] **Centralized Logging**
  - Set up **Fluentd** (Fluent Bit) or **Elasticstack (ELK)** to aggregate logs from all pods.
  - *Goal:* Make debugging easier than running `kubectl logs` manually.

## Deployment Instructions

### 1. Rebuild Application Images
You need to rebuild the backend and frontend images to include the new OpenTelemetry and Prometheus dependencies.

```bash
# Backend (from project root)
docker build -t libro-mind-backend:v14 ./ecom

# Frontend (from project root)
docker build -t libro-mind-frontend:v5 ./my-next-app
```

> **Note:** Ensure you update the image tags in `k8s-manifests/backend.yaml` and `k8s-manifests/frontend.yaml` if you use different tags.

### 2. Create Namespaces
Create the necessary namespaces for the observability stack.

```bash
kubectl create namespace logging
# The 'libro-mind' namespace should already exist, but if not:
# kubectl create namespace libro-mind
```

### 3. Deploy Observability Stack

#### Distributed Tracing (Jaeger)
```bash
kubectl apply -f k8s-manifests/jaeger.yaml
```

#### Metrics & Dashboards (Prometheus & Grafana)
```bash
kubectl apply -f k8s-manifests/prometheus.yaml
kubectl apply -f k8s-manifests/grafana.yaml
```

#### Centralized Logging (ELK Stack + Fluent Bit)
```bash
kubectl apply -f k8s-manifests/logging-elasticsearch.yaml
kubectl apply -f k8s-manifests/logging-kibana.yaml
kubectl apply -f k8s-manifests/logging-fluent-bit.yaml
```

### 4. Update Application Configuration
Apply the updated ConfigMap and Deployments to enable instrumentation.

```bash
kubectl apply -f k8s-manifests/config.yaml
kubectl apply -f k8s-manifests/backend.yaml
kubectl apply -f k8s-manifests/frontend.yaml
```

### 5. Access Dashboards

- **Jaeger UI:** `http://localhost:16686` (via `kubectl port-forward -n libro-mind service/jaeger 16686:16686`)
- **Prometheus:** `http://localhost:9090` (via `kubectl port-forward -n libro-mind service/prometheus-service 9090:9090`)
- **Grafana:** `http://localhost:3000` (via `kubectl port-forward -n libro-mind service/grafana-service 3000:3000`)
  - *Login:* admin / admin (or anonymous if enabled)
- **Kibana:** `http://localhost:5601` (via `kubectl port-forward -n logging service/kibana 5601:5601`)
