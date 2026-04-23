# --- 1. DATABASE SECURITY GROUP ---
resource "aws_security_group" "db_sg" {
  name        = "${var.db_name}-sg"
  description = "Allow inbound traffic from EKS"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Adjust this to your VPC CIDR for better security
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- 2. DB SUBNET GROUP ---
resource "aws_db_subnet_group" "this" {
  name       = "${var.db_name}-subnet-group"
  subnet_ids = var.db_subnets

  tags = { Name = "${var.db_name}-subnet-group" }
}

# --- 3. THE RDS INSTANCE ---
resource "aws_db_instance" "healthsentinel_db" {
  identifier           = "healthsentinel-db"
  allocated_storage    = 20
  db_name              = var.db_name
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  username             = "sentinel_admin"
  password             = var.db_password
  skip_final_snapshot  = true
  db_subnet_group_name = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
}

# --- 4. THE VARIABLES (Keep these at the bottom) ---
variable "db_name" {}
variable "vpc_id" {}
variable "db_subnets" {}
variable "db_password" {}
