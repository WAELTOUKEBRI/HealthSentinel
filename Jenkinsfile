pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "healthsentinel-backend"
        DOCKER_IMAGE_FRONTEND = "healthsentinel-frontend"
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

                stage('Gitleaks (BLOCKING)') {
                    steps {
                        sh '''
                        docker run --rm \
                        -v ${WORKSPACE}:/repo \
                        zricethezav/gitleaks:latest detect \
                        --source /repo --no-git
                        '''
                    }
                }

                stage('Bandit (BLOCKING)') {
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

                            sh "docker build --no-cache -t ${DOCKER_IMAGE_BACKEND}:latest ."

                            /* ===== FIXED SBOM PATH ===== */
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v $(pwd):/out \
                            aquasec/trivy:0.50.1 image \
                            --scanners vuln \
                            --format cyclonedx \
                            --output /out/sbom-backend.json \
                            ${DOCKER_IMAGE_BACKEND}:latest
                            '''

                            sh 'test -f sbom-backend.json'

                            archiveArtifacts artifacts: 'sbom-backend.json', fingerprint: true

                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:0.50.1 image \
                            --severity CRITICAL \
                            --exit-code 1 \
                            ${DOCKER_IMAGE_BACKEND}:latest
                            '''

                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:0.50.1 image \
                            --severity HIGH \
                            --format table \
                            ${DOCKER_IMAGE_BACKEND}:latest
                            '''
                        }
                    }
                }

                stage('Frontend') {
                    steps {
                        dir('healthsentinel-frontend') {

                            sh "docker build --no-cache -t ${DOCKER_IMAGE_FRONTEND}:latest ."

                            /* ===== FIXED SBOM PATH ===== */
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v $(pwd):/out \
                            aquasec/trivy:0.50.1 image \
                            --scanners vuln \
                            --format cyclonedx \
                            --output /out/sbom-frontend.json \
                            ${DOCKER_IMAGE_FRONTEND}:latest
                            '''

                            sh 'test -f sbom-frontend.json'

                            archiveArtifacts artifacts: 'sbom-frontend.json', fingerprint: true

                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:0.50.1 image \
                            --severity CRITICAL \
                            --exit-code 1 \
                            ${DOCKER_IMAGE_FRONTEND}:latest
                            '''

                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:0.50.1 image \
                            --severity HIGH \
                            --format table \
                            ${DOCKER_IMAGE_FRONTEND}:latest
                            '''
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
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
                            -Dsonar.token=${SONAR_TOKEN}
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
            docker container prune -f || true
            docker image prune -f || true
            docker builder prune -f || true
            '''
        }
    }
}
