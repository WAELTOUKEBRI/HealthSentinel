pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "healthsentinel-backend"
        DOCKER_IMAGE_FRONTEND = "healthsentinel-frontend"
        AWS_ACCOUNT_ID = "123456789012"
        REGION = "eu-west-3"
    }

    stages {
        stage('Initial Cleanup') {
            steps {
                cleanWs()
                checkout scm
            }
        }

        stage('Security Analysis') {
            parallel {
                stage('Gitleaks (Secrets)') {
                    steps {
                        sh 'docker run --rm -v ${WORKSPACE}:/path zricethezav/gitleaks:latest detect --source /path --no-git'
                    }
                }
                stage('Bandit (Python)') {
                    steps {
                        sh "docker run --rm -v ${WORKSPACE}/healthsentinel-backend:/app -w /app cytopia/bandit -r . --exclude ./venv -ll"
                    }
                }
            }
        }

        stage('Infrastructure Linting') {
            steps {
                echo "🚀 Linting Dockerfiles (Ignoring version-pinning warnings)..."
                // Adding 'hadolint' command and ignore flags inside the container
                sh 'docker run --rm -i hadolint/hadolint hadolint --ignore DL3008 --ignore DL3013 - < healthsentinel-backend/Dockerfile'
                sh 'docker run --rm -i hadolint/hadolint hadolint --ignore DL3008 --ignore DL3016 - < healthsentinel-frontend/Dockerfile'
            }
        }

        stage('Prisma Validation') {
            steps {
                echo "Validating Database Schema..."
                sh '''
                    docker run --rm -v ${WORKSPACE}/healthsentinel-backend:/app -w /app \
                    node:22-slim bash -c "npx prisma validate --schema=./prisma/schema.prisma"
                '''
            }
        }

        stage('Build & Image Scanning') {
            steps {
                dir('healthsentinel-backend') {
                    echo "Building Backend (No-Cache)..."
                    sh 'docker build --no-cache -t ${DOCKER_IMAGE_BACKEND}:latest .'
                    
                    echo "Scanning with Trivy..."
                    sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image ${DOCKER_IMAGE_BACKEND}:latest'
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner " +
                            "-Dsonar.projectKey=HealthSentinel " +
                            "-Dsonar.sources=. " +
                            "-Dsonar.exclusions=**/node_modules/**,**/venv/**,terraform/**"
                    }
                }
            }
        }
    }
}
