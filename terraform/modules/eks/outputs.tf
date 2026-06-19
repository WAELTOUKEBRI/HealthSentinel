output "node_security_group_id" {
  description = "The ID of the security group created for total worker node communication"
  value       = module.eks.node_security_group_id
}
