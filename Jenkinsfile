pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "healthsentinel-backend"
        AWS_ACCOUNT_ID = "123456789012"
        REGION = "eu-west-3"
    }

    stages {
        stage('Initialize') {
            steps {
                // Best Practice: Start with a clean slate every time
                cleanWs()
                checkout scm
            }
        }

        stage('Security Scans') {
            parallel {
                stage('Gitleaks') {
                    steps {
                        echo "Running Gitleaks..."
                        sh 'docker run --rm -v ${WORKSPACE}:/path zricethezav/gitleaks:latest detect --source /path --no-git'
                    }
                }
                stage('Bandit') {
                    steps {
                        echo "Running Bandit..."
                        sh "docker run --rm -v ${WORKSPACE}/healthsentinel-backend:/app -w /app cytopia/bandit -r . --exclude ./venv -ll"
                    }
                }
            }
        }

        stage('Linting') {
            steps {
                echo "🚀 Linting Dockerfiles..."
                sh 'docker run --rm -i hadolint/hadolint < healthsentinel-backend/Dockerfile'
                sh 'docker run --rm -i hadolint/hadolint < healthsentinel-frontend/Dockerfile'
            }
        }

        stage('Prisma Validation') {
            steps {
                echo "Validating Database Schema..."
                sh '''
                    docker run --rm -v ${WORKSPACE}/healthsentinel-backend:/app -w /app \
                    node:22-slim bash -c "rm -f prisma.config.ts && npx prisma validate --schema=./prisma/schema.prisma"
                '''
            }
        }

        stage('Build & Trivy Scan') {
            steps {
                dir('healthsentinel-backend') {
                    echo "Building Backend (No-Cache)..."
                    sh 'docker build --no-cache -t ${DOCKER_IMAGE_BACKEND}:latest .'
                    
                    echo "Scanning with Trivy..."
                    // Correct Trivy command using the local socket
                    sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image ${DOCKER_IMAGE_BACKEND}:latest'
                }
            }
        }

        stage('SonarQube') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner " +
                            "-Dsonar.projectKey=HealthSentinel " +
                            "-Dsonar.sources=. " +
                            "-Dsonar.exclusions=**/node_modules/**,**/venv/** "
                    }
                }
            }
        }
    }
}
