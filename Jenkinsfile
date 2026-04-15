pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "healthsentinel-backend"
        DOCKER_IMAGE_FRONTEND = "healthsentinel-frontend"
        REGION = "eu-west-3"
        TRIVY_CACHE = "/home/jenkins/trivy-cache"
    }

    stages {

        stage('Checkout') {
            steps {
                deleteDir()
                checkout scm
            }
        }

        stage('Security Analysis') {
            parallel {

                stage('Gitleaks') {
                    steps {
                        sh '''
                        docker run --rm \
                        -v ${WORKSPACE}:/repo \
                        zricethezav/gitleaks:latest detect \
                        --source /repo --no-git
                        '''
                    }
                }

                stage('Bandit') {
                    steps {
                        sh '''
                        docker run --rm \
                        -v ${WORKSPACE}:/repo \
                        -w /repo/healthsentinel-backend \
                        cytopia/bandit -r . --exclude ./venv -ll
                        '''
                    }
                }
            }
        }

        stage('Docker Lint') {
            steps {
                sh '''
                echo "🔎 Running Hadolint safely..."

                docker run --rm \
                -v ${WORKSPACE}:/repo \
                hadolint/hadolint \
                hadolint \
                --ignore DL3008 \
                --ignore DL3013 \
                /repo/healthsentinel-backend/Dockerfile

                docker run --rm \
                -v ${WORKSPACE}:/repo \
                hadolint/hadolint \
                hadolint \
                --ignore DL3008 \
                --ignore DL3016 \
                /repo/healthsentinel-frontend/Dockerfile
                '''
            }
        }

        stage('Prisma Validation') {
            steps {
                dir('healthsentinel-backend') {
                    sh '''
                    docker build --target builder -t backend-linter .

                    docker run --rm \
                    -e DATABASE_URL="postgresql://user:pass@localhost:5432/db" \
                    backend-linter \
                    npx prisma validate --schema=./prisma/schema.prisma
                    '''
                }
            }
        }

        stage('Build & Scan') {
            parallel {

                stage('Backend') {
                    steps {
                        dir('healthsentinel-backend') {

                            sh "docker rmi -f ${DOCKER_IMAGE_BACKEND}:latest || true"
                            sh "docker build --no-cache --pull -t ${DOCKER_IMAGE_BACKEND}:latest ."

                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --format cyclonedx \
                            -o sbom-backend.json \
                            healthsentinel-backend:latest
                            '''

                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --severity CRITICAL \
                            --exit-code 1 \
                            --ignore-unfixed \
                            --ignorefile .trivyignore \
                            healthsentinel-backend:latest
                            '''
                        }
                    }
                }

                stage('Frontend') {
                    steps {
                        dir('healthsentinel-frontend') {

                            sh "docker rmi -f ${DOCKER_IMAGE_FRONTEND}:latest || true"
                            sh "docker build --no-cache --pull -t ${DOCKER_IMAGE_FRONTEND}:latest ."

                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --format cyclonedx \
                            -o sbom-frontend.json \
                            healthsentinel-frontend:latest
                            '''

                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --severity CRITICAL \
                            --exit-code 1 \
                            --ignore-unfixed \
                            --ignorefile .trivyignore \
                            healthsentinel-frontend:latest
                            '''
                        }
                    }
                }
            }
        }

        stage('SonarQube') {
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
                            -Dsonar.exclusions=**/node_modules/**,**/venv/**,**/.next/**,**/dist/**,**/build/**,terraform/**
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            sh '''
            echo "🧹 Cleaning Docker environment..."
            docker container prune -f || true
            docker image prune -f || true
            docker builder prune -f || true
            '''
        }
    }
}
