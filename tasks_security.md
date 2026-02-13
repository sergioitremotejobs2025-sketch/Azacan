# Security Tasks

Based on `PROJECT_IMPROVEMENTS.md`, here is the list of pending tasks for Security:

- [ ] **Secrets Management**
  - [ ] Create `ExternalSecret` manifests (assuming External Secrets Operator is installed).
  - [ ] Configure access to Google Secret Manager (mock/template if actual GCP access is limited).
  - *Goal:* Replace standard K8s secrets with externally managed ones.

- [ ] **Network Policies**
  - [ ] Create default-deny policy for the namespace.
  - [ ] Allow Frontend -> Backend communication.
  - [ ] Allow Backend -> Database communication.
  - [ ] Allow Backend -> Redis/Ollama/External APIs.
  - *Goal:* Zero-trust network segmentation.

- [ ] **Container Security Scanning**
  - [ ] Add **Trivy** scan step to the GitHub Actions CI workflow.
  - [ ] Configure it to fail builds on Critical vulnerabilities (optional, but good practice).
  - *Goal:* Shift security left by catching vulnerabilities before deployment.
