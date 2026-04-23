variable "cluster_name" {}
variable "vpc_id" {}
variable "private_subnets" {}
variable "enable_auto_mode" { default = true }

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnets

  cluster_endpoint_public_access = true
  enable_cluster_creator_admin_permissions = true

  # ADD THIS BLOCK HERE (Inside the module "eks" block)
  cluster_addons = {
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }



  # The foundational nodes for our EKS cluster
  eks_managed_node_groups = {
    initial = {
      instance_types = ["t3.medium"]
      min_size       = 1
      max_size       = 3
      desired_size   = 2

      # ADD THIS SO NODES CAN TALK TO EBS
      iam_role_additional_policies = {
        AmazonEBSCSIDriverPolicy = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
    }
  }
}
}
