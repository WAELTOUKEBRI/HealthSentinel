terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
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
  default_tags {
    tags = {
      Project   = "HealthSentinel"
      ManagedBy = "Terraform"
      Owner     = "WaelToukebri"
    }
  }
}
