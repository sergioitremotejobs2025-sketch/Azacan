# DevOps & Infrastructure Implementation Tasks

This document details the pending tasks to modernize the infrastructure using **Helm**, **Terraform**, and **Horizontal Pod Autoscaling (HPA)**.

---

## 1. Horizontal Pod Autoscaling (HPA)
**Objective:** Automatically scale `backend` and `frontend` pods based on CPU/Memory usage.

- [x] **Define Resource Requests & Limits**
  - [x] Audit current usage of `backend` (Django) and `frontend` (Next.js) pods.
  - [x] Update `deployment.yaml` files to set appropriate `resources.requests` and `resources.limits`.
    - *Example (Backend):* `requests: cpu: 250m, memory: 512Mi`; `limits: cpu: 500m, memory: 1Gi`.

- [x] **Install Metrics Server**
  - [x] Check if Metrics Server is running in the cluster (`kubectl top nodes`).
  - [x] If not, deploy it via Helm or official manifests (required for HPA to get metrics).

- [x] **Create HPA Manifests**
  - [x] Create `hpa-backend.yaml`: Scale backend between 1 and 5 replicas if CPU > 70%.
  - [x] Create `hpa-frontend.yaml`: Scale frontend between 1 and 3 replicas if CPU > 70%.

- [x] **Load Testing Verification**
  - [x] Use a tool like **k6** or **Apache Benchmark (ab)** to simulate traffic.
  - [x] Verify pods scale up when load increases and scale down when it subsides.

---

## 2. Infrastructure as Code (Terraform / OpenTofu)
**Objective:** Replace manual GCloud/ClickOps setup with reproducible code.

- [x] **Setup Terraform Project**
  - [x] Initialize a `terraform/` directory.
  - [x] Configure the backend (GCS bucket) to store the Terraform state file securely.

- [x] **Define GCP Resources**
  - [x] **Networking:** Define VPC, Subnets, and Firewall rules.
  - [x] **GKE Cluster:** Define the Kubernetes cluster (Regional/Zonal), Node Pools (standard vs. spot instances for cost savings).
  - [x] **Databases:** define Cloud SQL (Postgres) instance.
  - [x] **IAM:** Define Service Accounts and IAM bindings (Workload Identity).

- [ ] **Import Existing State (Optional)**
  - [ ] If preserving the current cluster, use `terraform import` to bring existing resources under management.
  - [ ] *Alternative:* Spin up a parallel "v2" environment to test clean creation.

- [ ] **CI/CD Integration**
  - [ ] Create a GitHub Action to run `terraform plan` on PRs and `terraform apply` on merge to main.

---

## 3. Helm Charts
**Objective:** Package the application for easier deployment across environments (Dev, Staging, Prod).

- [x] **Create Chart Structure**
  - [x] Initialize a new chart: `helm create libro-mind-chart`.
  - [x] Clean up default boilerplate values.

- [x] **Templatize Manifests**
  - [x] **Deployments:** Convert hardcoded image tags, replicas, and env vars to usage of `{{ .Values... }}`.
  - [x] **Services:** Make ports and service types (ClusterIP vs LoadBalancer) configurable.
  - [x] **Ingress:** Add an optional Ingress template with TLS configuration.

- [x] **Define Values Files**
  - [x] `values.yaml`: Default values (likely for Dev/Minikube).
  - [x] `values-prod.yaml`: Production overrides (High availability, increased resources, real domain names).

- [x] **Dependency Management**
  - [x] Add `postgresql` or `bitnami/postgresql` as a sub-chart dependency.

- [x] **Deployment Strategy**
  - [x] Update GitHub Actions to deploy using `helm upgrade --install` instead of `kubectl apply -f k8s-manifests/`.

---

## 4. Advanced: Service Mesh (Istio / Linkerd)
**Objective:** Enhance security and observability.

- [x] **Installation**
  - [x] **Prepare Manifests**: Create Gateway & VirtualService templates (completed in Helm).
  - [x] **Install Istio CLI**: Download `istioctl`.
  - [x] **Install Control Plane**: Run `istioctl install --set profile=demo -y`.
  - [x] **Enable Sidecar Injection**: Label request namespace: `kubectl label namespace libro-mind istio-injection=enabled`.

- [x] **Traffic Management**
  - [x] **Apply Gateway**: Apply `istio-manifests/libro-mind-gateway.yaml`.
  - [x] **Verify Routing**: Ensure `/api` goes to Backend and `/` goes to Frontend via the Istio Ingress Gateway IP.
  - [ ] **Define DestinationRules**: Create policies for load balancing (e.g., LEAST_CONN) and connection pooling.

- [x] **Observability (Kiali/Jaeger)**
  - [x] Install addons: `prometheus.yaml`, `kiali.yaml`, `jaeger.yaml`.
  - [x] View Dashboard: `istioctl dashboard kiali`.

- [x] **Zero-Trust Security (mTLS)**
  - [x] Enable strict mTLS mode: Create a `PeerAuthentication` policy.
  - [x] Verify pod connectivity within the mesh.
