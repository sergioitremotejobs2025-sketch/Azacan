output "cluster_name" {
  description = "Cluster Name"
  value       = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  description = "Cluster Endpoint"
  value       = google_container_cluster.primary.endpoint
}

output "cluster_ca_certificate" {
  description = "Cluster CA Certificate"
  sensitive   = true
  value       = google_container_cluster.primary.master_auth.0.cluster_ca_certificate
}

output "get_credentials_command" {
  description = "Command to get cluster credentials"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --zone ${google_container_cluster.primary.location} --project ${var.project_id}"
}
