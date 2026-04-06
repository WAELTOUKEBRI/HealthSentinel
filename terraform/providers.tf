terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "wael-toukebri-healthsentinel-state"
    key            = "dev/terraform.tfstate"
    region         = "eu-west-3"
    dynamodb_table = "healthsentinel-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "eu-west-3"

  # This automatically tags every resource with the project name
  default_tags {
    tags = {
      Project   = "HealthSentinel"
      ManagedBy = "Terraform"
      Owner     = "WaelToukebri"
    }
  }
}
