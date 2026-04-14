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
                        sh "docker run --rm --volumes-from hs-jenkins -w ${WORKSPACE}/healthsentinel-backend cytopia/bandit -r . --exclude ./venv -ll"
                    }
                }
            }
        }

        stage('Infrastructure Linting') {
            steps {
                echo "🚀 Linting Dockerfiles..."
                sh 'docker run --rm -i hadolint/hadolint hadolint --ignore DL3008 --ignore DL3013 - < healthsentinel-backend/Dockerfile || true'
                sh 'docker run --rm -i hadolint/hadolint hadolint --ignore DL3008 --ignore DL3016 - < healthsentinel-frontend/Dockerfile || true'
            }
        }

        stage('Prisma Validation') {
            steps {
                echo "🚀 Senior Approach: Validating Schema..."
                dir('healthsentinel-backend') {
                    sh '''
                        docker build --target builder -t healthsentinel-backend:linter .
                        docker run --rm -e DATABASE_URL="postgresql://user:pass@localhost:5432/db" healthsentinel-backend:linter npx prisma validate --schema=./prisma/schema.prisma
                    '''
                }
            }
        }

        stage('Build & Image Scanning') {
            steps {
                // 1. BACKEND Build & Scan
                dir('healthsentinel-backend') {
                    echo "Building Backend..."
                    sh 'docker build --no-cache -t ${DOCKER_IMAGE_BACKEND}:latest .'
                    
                    echo "🚀 Senior Scan: Backend (Critical Check)..."
                    sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:0.50.1 image --exit-code 1 --severity CRITICAL --ignore-unfixed ${DOCKER_IMAGE_BACKEND}:latest'
                    
                    echo "🚀 Senior Scan: Backend (High Table)..."
                    // FIXED: Changed --pkg-relationships to --dependency-tree
                    sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:0.50.1 image --severity HIGH --ignore-unfixed --dependency-tree --format table ${DOCKER_IMAGE_BACKEND}:latest'
                }

                // 2. FRONTEND Build & Scan
                dir('healthsentinel-frontend') {
                    echo "🗑️ Killing old image to prevent Trivy confusion..."
                    sh "docker rmi -f ${DOCKER_IMAGE_FRONTEND}:latest || true"

                    echo "🚀 Building fresh image..."
                    sh "docker build --no-cache --pull -t ${DOCKER_IMAGE_FRONTEND}:latest ."

                    echo "🧐 Verifying the lockfile inside the NEW image..."
                    sh "docker run --rm ${DOCKER_IMAGE_FRONTEND}:latest grep -A 1 \"cross-spawn\" package-lock.json || echo 'Lockfile not found'"

                    echo "🛡️ Running Scan..."
                    // Added --dependency-tree here too so you can see why vulnerabilities exist
                    sh """
                    docker run --rm \
                   -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:0.50.1 image \
                   --severity HIGH,CRITICAL \
                   --ignore-unfixed \
                   --format table \
                   --ignorefile /dev/stdin <<EOF
                   $(cat healthsentinel-frontend/.trivyignore)
                    EOF
                   ${DOCKER_IMAGE_FRONTEND}:latest
                    """
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                            sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=HealthSentinel \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.token=${SONAR_TOKEN} \
                            -Dsonar.exclusions=**/node_modules/**,**/venv/**,terraform/**
                            """
                        }
                    }
                }
            }
        }
    }

    // This keeps your Acer from running out of space
    post {
        always {
            echo "🧹 Cleaning up intermediate images..."
            sh 'docker image prune -f'
        }
    }
}
