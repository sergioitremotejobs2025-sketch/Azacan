variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone to deploy resources"
  type        = string
  default     = "us-central1-c"
}

variable "cluster_name" {
  description = "The name of the GKE cluster"
  type        = string
  default     = "libro-mind-cluster"
}
