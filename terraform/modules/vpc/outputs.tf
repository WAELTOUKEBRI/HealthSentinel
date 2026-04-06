output "vpc_id" {
  # This tells Terraform to take the ID from the official module
  value       = module.vpc.vpc_id 
  description = "vpc-0876720d62f345123"
}

output "database_subnets" { value = module.vpc.database_subnets }

output "private_subnets" {
  value       = module.vpc.private_subnets
  description = "List of IDs of private subnets"
}

output "public_subnets" {
  value       = module.vpc.public_subnets
  description = "List of IDs of public subnets"
}
