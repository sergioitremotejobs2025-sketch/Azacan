# DevOps & Infrastructure Tasks

Based on `PROJECT_IMPROVEMENTS.md`, here is the list of pending tasks for DevOps & Infrastructure:

- [x] **Horizontal Pod Autoscaling (HPA)**
  - [x] Define resource requests and limits for `backend` and `frontend` deployments.
  - [x] Create `HorizontalPodAutoscaler` manifests targeting CPU/Memory utilization (e.g., 50% CPU).
  - *Goal:* Automatically scale pods based on traffic load.

- [x] **Infrastructure as Code (IaC)**
  - [x] Create **Terraform** or **OpenTofu** configuration to provision the GKE cluster and related resources (VPC, Subnets).
  - [x] Migrate manual `kubectl apply` workflows to Terraform state management.
  - *Goal:* Reproducible and version-controlled infrastructure.

- [x] **Helm Charts**
  - [x] Package the application manifests (`k8s-manifests/*.yaml`) into a **Helm Chart**.
  - [x] Create `values.yaml` for configuration (image tags, replicas, resource limits).
  - *Goal:* Simplify deployment across environments (dev, staging, prod).
