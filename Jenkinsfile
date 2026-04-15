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
                        -v ${WORKSPACE}:/path \
                        zricethezav/gitleaks:latest detect \
                        --source /path --no-git
                        '''
                    }
                }

                stage('Bandit') {
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

        stage('Docker Lint') {
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
                              -v ${WORKSPACE}/healthsentinel-backend:/project \
                              aquasec/trivy:0.50.1 image \
                              --format cyclonedx \
                              -o /project/sbom-backend.json \
                              ${DOCKER_IMAGE_BACKEND}:latest
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
                              ${DOCKER_IMAGE_BACKEND}:latest
                            '''

                            sh '''
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --severity HIGH \
                              --ignore-unfixed \
                              --ignorefile .trivyignore \
                              --format table \
                              ${DOCKER_IMAGE_BACKEND}:latest
                            '''

                            archiveArtifacts artifacts: 'sbom-backend.json', fingerprint: true
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
                              -v ${WORKSPACE}/healthsentinel-frontend:/project \
                              aquasec/trivy:0.50.1 image \
                              --format cyclonedx \
                              -o /project/sbom-frontend.json \
                              ${DOCKER_IMAGE_FRONTEND}:latest
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
                              ${DOCKER_IMAGE_FRONTEND}:latest
                            '''

                            sh '''
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --severity HIGH \
                              --ignore-unfixed \
                              --ignorefile .trivyignore \
                              --format table \
                              ${DOCKER_IMAGE_FRONTEND}:latest
                            '''

                            archiveArtifacts artifacts: 'sbom-frontend.json', fingerprint: true
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
                            -Dsonar.exclusions=**/node_modules/**,**/venv/**,terraform/**
                            """
                        }
                    }
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
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
