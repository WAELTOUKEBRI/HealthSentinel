module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  # High Availability: Spread across two AZs
  azs             = ["eu-west-3a", "eu-west-3b"]
  
  # Public Subnets: For Load Balancers & NAT Gateway
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  
  # Private Subnets: For EKS Worker Nodes (The App)
  private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]
  
  # Database Subnets: For RDS & ElastiCache (Isolated)
  database_subnets = ["10.0.20.0/24", "10.0.21.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true # Saves money for our dev environment
  enable_vpn_gateway   = false
  
  # Required for EKS to function correctly
  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1" # Tells AWS to put Public Load Balancers here
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1" # For internal EKS traffic
  }
}
