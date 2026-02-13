variable "project_id" {
  description = "The GCP Project ID where resources will be deployed."
  type        = string
  default     = "ecom-book-app-2026"
}

variable "region" {
  description = "The GCP region for the cluster."
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone for the cluster."
  type        = string
  default     = "us-central1-a"
}

variable "cluster_name" {
  description = "Name of the GKE cluster."
  type        = string
  default     = "libro-mind-cluster"
}

variable "machine_type" {
  description = "Machine type for GKE nodes."
  type        = string
  default     = "e2-medium"
}

variable "db_instance_name" {
  description = "The name of the Cloud SQL instance."
  type        = string
  default     = "libro-mind-postgres"
}
