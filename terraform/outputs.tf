output "cluster_name" {
  description = "Cluster name"
  value       = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  description = "Cluster endpoint"
  value       = google_container_cluster.primary.endpoint
}

output "get_credentials_command" {
  description = "gcloud command to get credentials"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${var.region}"
}

output "sql_instance_connection_name" {
  description = "The connection name of the Cloud SQL instance."
  value       = google_sql_database_instance.postgres.connection_name
}

output "sql_instance_ip" {
  description = "The private IP address of the Cloud SQL instance."
  value       = google_sql_database_instance.postgres.private_ip_address
}
