pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "healthsentinel-backend"
        DOCKER_IMAGE_FRONTEND = "healthsentinel-frontend"
        REGION = "eu-west-3"
        TRIVY_CACHE = "${WORKSPACE}/.trivy-cache"
        SBOM_DIR = "${WORKSPACE}/sbom"
        SONAR_HOST_URL = "http://hs-sonarqube:9000"
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
                        -v ${WORKSPACE}:/src \
                        zricethezav/gitleaks:latest detect \
                        --source /src --no-git --verbose
                        '''
                    }
                }

                stage('Bandit') {
                    steps {
                        dir('healthsentinel-backend') {
                            sh """
                            docker run --rm \
                            -v \$(pwd):/app \
                            -w /app \
                            cytopia/bandit -r . --exclude ./venv -ll -f json -o /app/bandit-report.json
                            """
                        }
                    }
                    post {
                        always {
                                archiveArtifacts artifacts: '**/bandit-report.json', allowEmptyArchive: true
                        }
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
                    # Build the full image so all files (.py, requirements, prisma) are inside
                    docker build -t healthsentinel-test-image .
                    docker run --rm \
                    --network healthsentinel-network \
                    -e DATABASE_URL="postgresql://wael_admin:dev_password_123@hs-db:5432/healthsentinel_db" \
                    healthsentinel-test-image \
                    python3 -m prisma validate --schema=./prisma/schema.prisma
                    '''
                }
            }
        }



        stage('Testing & Coverage') {
    parallel {
        stage('Backend Tests') {
            steps {
                dir('healthsentinel-backend') {
                    sh 'docker run --rm --network healthsentinel-network healthsentinel-test-image python3 -m pytest'
                }
            }
        }
        stage('Frontend Tests') {
            steps {
                dir('healthsentinel-frontend') {
                    sh 'docker build --target builder -t frontend-test .'
                    sh 'docker run --rm --network healthsentinel-network frontend-test npm run test:coverage'
                }
            }
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

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              -v \$(pwd):/out \
                              aquasec/trivy:0.50.1 image \
                              --format cyclonedx \
                              --timeout 15m \
                              -o /out/sbom-backend.json \
                              ${DOCKER_IMAGE_BACKEND}:latest
                            """

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --timeout 15m \
                              --severity CRITICAL \
                              --exit-code 1 \
                              --ignore-unfixed \
                              ${DOCKER_IMAGE_BACKEND}:latest
                            """
                        }
                    }

                    post {
                        always {
                                archiveArtifacts artifacts: 'healthsentinel-backend/sbom-backend.json', allowEmptyArchive: true
                        }
                    }
                }

                stage('Frontend') {
                    steps {
                        dir('healthsentinel-frontend') {
                            sh "docker rmi -f ${DOCKER_IMAGE_FRONTEND}:latest || true"
                            sh """
                            docker build --no-cache --pull -t ${DOCKER_IMAGE_FRONTEND}:latest \
                            --build-arg NEXT_PUBLIC_API_URL=/api \
                            --build-arg NEXT_PUBLIC_WS_URL=/ws/patients .
                            """

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              -v \$(pwd):/out \
                              aquasec/trivy:0.50.1 image \
                              --format cyclonedx \
                              --download-timeout 15m \
                              -o /out/sbom-frontend.json \
                              ${DOCKER_IMAGE_FRONTEND}:latest
                            """

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --download-timeout 15m \
                              --severity CRITICAL \
                              --exit-code 1 \
                              --ignore-unfixed \
                              ${DOCKER_IMAGE_FRONTEND}:latest
                            """
                        }
                    }
                    post {
                        always {
                                archiveArtifacts artifacts: 'healthsentinel-frontend/sbom-frontend.json', allowEmptyArchive: true
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
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.token=$SONAR_TOKEN \
                            -Dsonar.python.version=3 \
                            -Dsonar.javascript.node.max_old_space_size=4096 \
                            -Dsonar.exclusions=**/node_modules/**,**/venv/**,terraform/**,**/sbom/**
                            """
                        }
                    }
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
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
