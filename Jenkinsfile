pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "healthsentinel-backend"
        DOCKER_IMAGE_FRONTEND = "healthsentinel-frontend"
        AWS_ACCOUNT_ID = "123456789012"
        REGION = "eu-west-3"
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
                stage('Gitleaks (Secrets)') {
                    steps {
                        sh '''
                        docker run --rm \
                        -v ${WORKSPACE}:/path \
                        zricethezav/gitleaks:latest detect \
                        --source /path --no-git
                        '''
                    }
                }

                stage('Bandit (Python)') {
                    steps {
                        sh '''
                        docker run --rm \
                        -v ${WORKSPACE}:/src \
                        -w /src/healthsentinel-backend \
                        cytopia/bandit -r . --exclude ./venv -ll
                        '''
                    }
                }
            }
        }

        stage('Infrastructure Linting') {
            steps {
                sh '''
                docker run --rm -i hadolint/hadolint \
                hadolint --ignore DL3008 --ignore DL3013 \
                - < healthsentinel-backend/Dockerfile || true

                docker run --rm -i hadolint/hadolint \
                hadolint --ignore DL3008 --ignore DL3016 \
                - < healthsentinel-frontend/Dockerfile || true
                '''
            }
        }

        stage('Prisma Validation') {
            steps {
                dir('healthsentinel-backend') {
                    sh '''
                    docker build --target builder -t healthsentinel-backend:linter .
                    docker run --rm \
                    -e DATABASE_URL="postgresql://user:pass@localhost:5432/db" \
                    healthsentinel-backend:linter \
                    npx prisma validate --schema=./prisma/schema.prisma
                    '''
                }
            }
        }

        stage('Build & Scan Images') {
            parallel {

                // ================= BACKEND =================
                stage('Backend') {
                    steps {
                        dir('healthsentinel-backend') {

                            sh "docker rmi -f ${DOCKER_IMAGE_BACKEND}:latest || true"
                            sh "docker build --no-cache --pull -t ${DOCKER_IMAGE_BACKEND}:latest ."

                            // 📦 SBOM
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v /home/jenkins/trivy-cache:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --format cyclonedx \
                            -o sbom-backend.json \
                            ${DOCKER_IMAGE_BACKEND}:latest
                            '''

                            // 🚨 CRITICAL GATE
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v /home/jenkins/trivy-cache:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --severity CRITICAL \
                            --exit-code 1 \
                            --ignore-unfixed \
                            ${DOCKER_IMAGE_BACKEND}:latest
                            '''

                            // 📊 HIGH REPORT
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v /home/jenkins/trivy-cache:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --severity HIGH \
                            --ignore-unfixed \
                            --format table \
                            ${DOCKER_IMAGE_BACKEND}:latest
                            '''
                        }
                    }
                }

                // ================= FRONTEND =================
                stage('Frontend') {
                    steps {
                        dir('healthsentinel-frontend') {

                            sh "docker rmi -f ${DOCKER_IMAGE_FRONTEND}:latest || true"
                            sh "docker build --no-cache --pull -t ${DOCKER_IMAGE_FRONTEND}:latest ."

                            // 📦 SBOM
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v /home/jenkins/trivy-cache:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --format cyclonedx \
                            -o sbom-frontend.json \
                            ${DOCKER_IMAGE_FRONTEND}:latest
                            '''

                            // 🚨 CRITICAL GATE
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v /home/jenkins/trivy-cache:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --severity CRITICAL \
                            --exit-code 1 \
                            --ignore-unfixed \
                            ${DOCKER_IMAGE_FRONTEND}:latest
                            '''

                            // 📊 HIGH REPORT
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v /home/jenkins/trivy-cache:/root/.cache/aquasec/trivy \
                            aquasec/trivy:0.50.1 image \
                            --severity HIGH \
                            --ignore-unfixed \
                            --format table \
                            ${DOCKER_IMAGE_FRONTEND}:latest
                            '''
                        }
                    }
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

    post {
        always {
            sh '''
            echo "🧹 Cleaning Docker environment safely..."

            docker container prune -f || true
            docker image prune -f || true
            docker builder prune -f || true
            '''
        }
    }
}
