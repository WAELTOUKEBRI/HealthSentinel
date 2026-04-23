# --- 1. NETWORK MODULE (The Foundation) ---
module "network" {
  source       = "./modules/vpc"
  project_name = var.project_name
  vpc_cidr     = var.vpc_cidr
}

# --- 2. EKS MODULE (The Orchestrator) ---
module "eks" {
  source          = "./modules/eks"
  cluster_name    = "${var.project_name}-cluster"
  vpc_id          = module.network.vpc_id
  private_subnets = module.network.private_subnets
  enable_auto_mode = true
}

# --- 3. DATABASE MODULE (The Storage) ---
module "rds" {
  source       = "./modules/rds"
  db_name      = "healthsentinel"
  vpc_id       = module.network.vpc_id
  db_subnets   = module.network.database_subnets
  db_password  = var.db_password
}

# --- 4. CONTAINER REGISTRY (ECR) ---
resource "aws_ecr_repository" "healthsentinel_backend" {
  name                 = "healthsentinel-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_repository" "healthsentinel_frontend" {
  name                 = "healthsentinel-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  image_scanning_configuration { scan_on_push = true }
}
