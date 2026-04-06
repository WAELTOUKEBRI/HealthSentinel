output "vpc_id" {
  # This tells Terraform to take the ID from the official module
  value       = module.network.vpc_id
  description = "vpc-0876720d62f345123"
}

output "private_subnets" {
  value = module.network.private_subnets
}

output "alb_dns_name" {
  value = aws_lb.healthsentinel_alb.dns_name
}

output "public_subnets" {
  value = module.network.public_subnets
}
