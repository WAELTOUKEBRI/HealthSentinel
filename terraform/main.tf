# --- 1. NETWORK MODULE ---
module "network" {
  source       = "./modules/vpc"
  project_name = var.project_name
  vpc_cidr     = var.vpc_cidr
}

# --- 2. SECURITY GROUPS ---

# Load Balancer SG (Public)
resource "aws_security_group" "lb_sg" {
  name   = "healthsentinel-lb-sg"
  vpc_id = module.network.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Application SG (Private - for ECS)
resource "aws_security_group" "app_sg" {
  name   = "healthsentinel-app-sg"
  vpc_id = module.network.vpc_id

  # Backend Access
  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }

  # Frontend Access
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Database SG (Isolated)
resource "aws_security_group" "db_sg" {
  name   = "healthsentinel-db-sg"
  vpc_id = module.network.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- 3. DATABASE LAYER (RDS) ---

resource "aws_db_instance" "healthsentinel_db" {
  identifier             = "healthsentinel-db"
  allocated_storage      = 20
  db_name                = "healthsentinel"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t3.micro"
  username               = "sentinel_admin"
  password               = "Password123"
  skip_final_snapshot    = true
  db_subnet_group_name   = aws_db_subnet_group.db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
}

resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "healthsentinel-db-subnet-group"
  subnet_ids = module.network.database_subnets
}

# --- 4. COMPUTE LAYER (ECR, ECS & IAM) ---

resource "aws_ecr_repository" "healthsentinel_api" {
  name                 = "healthsentinel-api"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_repository" "healthsentinel_frontend" {
  name                 = "healthsentinel-frontend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecs_cluster" "healthsentinel_cluster" {
  name = "${var.project_name}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/healthsentinel-logs"
  retention_in_days = 7
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "healthsentinel-task-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# --- 5. BACKEND SERVICE & TASK ---

resource "aws_ecs_task_definition" "healthsentinel_task" {
  family                   = "healthsentinel-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([{
    name      = "healthsentinel-api"
    image     = "${aws_ecr_repository.healthsentinel_api.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 8000
      hostPort      = 8000
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
        "awslogs-region"        = "eu-west-3"
        "awslogs-stream-prefix" = "backend"
      }
    }
    environment = [
      { name = "DATABASE_URL", value = "postgresql://sentinel_admin:Password123@${aws_db_instance.healthsentinel_db.address}:5432/healthsentinel" }
    ]
  }])
}

resource "aws_ecs_service" "healthsentinel_service" {
  name            = "healthsentinel-service"
  cluster         = aws_ecs_cluster.healthsentinel_cluster.id
  task_definition = aws_ecs_task_definition.healthsentinel_task.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = module.network.private_subnets
    security_groups  = [aws_security_group.app_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_target_group.arn
    container_name   = "healthsentinel-api"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.api_listener]
}

# --- 6. FRONTEND SERVICE & TASK ---

resource "aws_ecs_task_definition" "frontend_task" {
  family                   = "healthsentinel-frontend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([{
    name      = "healthsentinel-frontend"
    image     = "${aws_ecr_repository.healthsentinel_frontend.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 3000
      hostPort      = 3000
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
        "awslogs-region"        = "eu-west-3"
        "awslogs-stream-prefix" = "frontend"
      }
    }
  }])
}

resource "aws_ecs_service" "frontend_service" {
  name            = "frontend-service"
  cluster         = aws_ecs_cluster.healthsentinel_cluster.id
  task_definition = aws_ecs_task_definition.frontend_task.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = module.network.private_subnets
    security_groups  = [aws_security_group.app_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend_tg.arn
    container_name   = "healthsentinel-frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.api_listener]
}

# --- 7. LOAD BALANCING (ALB) ---

resource "aws_lb" "healthsentinel_alb" {
  name               = "healthsentinel-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = module.network.public_subnets

  tags = { Name = "healthsentinel-alb" }
}

resource "aws_lb_target_group" "api_target_group" {
  name        = "healthsentinel-api-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = module.network.vpc_id
  target_type = "ip"

  health_check {
    path                = "/docs"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_target_group" "frontend_tg" {
  name        = "frontend-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = module.network.vpc_id
  target_type = "ip"

  health_check {
    path = "/"
    port = "3000"
  }
}

resource "aws_lb_listener" "api_listener" {
  load_balancer_arn = aws_lb.healthsentinel_alb.arn
  port              = "80"
  protocol          = "HTTP"

  # Default action: Route to Frontend
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

resource "aws_lb_listener_rule" "api_routing" {
  listener_arn = aws_lb_listener.api_listener.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_target_group.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/docs", "/openapi.json"]
    }
  }
}
