terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Terraform Backend Configuration (GCS)
# To enable remote state storage:
# 1. Create a GCS bucket manually: `gsutil mb gs://libro-mind-tf-state`
# 2. Uncomment the block below and run `terraform init`
terraform {
  backend "gcs" {
    bucket = "libro-mind-tf-state"
    prefix = "terraform/state"
  }
}
