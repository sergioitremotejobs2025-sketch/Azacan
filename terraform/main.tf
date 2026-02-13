# --- VPC Network ---
resource "google_compute_network" "vpc_network" {
  name                    = "libro-mind-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnetwork" {
  name          = "libro-mind-subnet"
  ip_cidr_range = "10.0.0.0/16"
  region        = var.region
  network       = google_compute_network.vpc_network.id
  
  secondary_ip_range {
    range_name    = "pods-range"
    ip_cidr_range = "10.1.0.0/16"
  }
  
  secondary_ip_range {
    range_name    = "services-range"
    ip_cidr_range = "10.2.0.0/20"
  }
}

# --- Firewall Rule ---
resource "google_compute_firewall" "internal_rule" {
  name    = "allow-internal"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/16"]
}

# --- GKE Cluster ---
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.zone
  
  # We delete the default node pool to create a separately managed one
  remove_default_node_pool = true
  initial_node_count       = 1
  
  network    = google_compute_network.vpc_network.id
  subnetwork = google_compute_subnetwork.subnetwork.id
  
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods-range"
    services_secondary_range_name = "services-range"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
  
  deletion_protection = false # For easier cleanup in dev
}

# --- Node Pool ---
resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.cluster_name}-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = 1

  autoscaling {
    min_node_count = 1
    max_node_count = 3
  }

  node_config {
    machine_type = var.machine_type
    
    # Google recommends custom service accounts that have cloud-platform scope.
    service_account = google_service_account.node_sa.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
    
    # Spot instances for cost saving
    # spot = true 
  }
}

# --- Private Service Access for Cloud SQL ---
resource "google_compute_global_address" "private_ip_address" {
  name          = "libro-mind-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc_network.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# --- Cloud SQL Instance ---
resource "google_sql_database_instance" "postgres" {
  name             = var.db_instance_name
  database_version = "POSTGRES_15"
  region           = var.region

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = "db-f1-micro" # Smallest tier for dev
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc_network.id
    }
    
    # Enable pgvector if possible via flags (Cloud SQL supports it by default, but you might need to load it)
    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }
  }
}

resource "google_sql_database" "database" {
  name     = "libro_mind_db"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "users" {
  name     = "app_user"
  instance = google_sql_database_instance.postgres.name
  password = "changeme123" # Use secret manager in prod
}

# --- Workload Identity IAM ---
# Allow the Kubernetes service account in 'libro-mind' to act as a GCP service account
resource "google_service_account" "app_sa" {
  account_id   = "libro-mind-app-sa"
  display_name = "Application Service Account for Workload Identity"
}

resource "google_service_account_iam_binding" "workload_identity_binding" {
  service_account_id = google_service_account.app_sa.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[libro-mind/backend-sa]"
  ]
}

# Give the app service account permissions to Cloud SQL
resource "google_project_iam_member" "sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# --- Service Account for GKE Nodes ---
resource "google_service_account" "node_sa" {
  account_id   = "gke-node-sa"
  display_name = "GKE Node Service Account"
}
