pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "healthsentinel-backend"
        DOCKER_IMAGE_FRONTEND = "healthsentinel-frontend"
        REGION = "eu-west-3"
        TRIVY_CACHE = "${WORKSPACE}/.trivy-cache"
        SBOM_DIR = "${WORKSPACE}/sbom"
        SONAR_HOST_URL = "http://hs-sonarqube:9000"
        PASS = credentials('DB_PASSWORD')

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
                                archiveArtifacts artifacts: '**/*.json', allowEmptyArchive: true
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
                    -e DATABASE_URL="postgresql://wael_admin:${PASS}@hs-db:5432/healthsentinel_db" \
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
                  sh """
                    docker run --rm --network healthsentinel-network \
                    -v \$(pwd):/app \
                    -e DATABASE_URL="postgresql://wael_admin:${PASS}@hs-db:5432/healthsentinel_db" \
                    healthsentinel-test-image \
                    python3 -m pytest --cov=. --cov-report=xml:coverage.xml
                    """
                }
            }
        }
        stage('Frontend Tests') {
            steps {
                dir('healthsentinel-frontend') {
                    sh 'docker build --target builder -t frontend-test .'
                    sh 'docker run --rm -v \$(pwd):/app frontend-test npm run test:coverage'
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
                            sh "chown \$(id -u):\$(id -g) sbom-backend.json || true"


                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --format table \
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
                                archiveArtifacts artifacts: '**/*.json', allowEmptyArchive: true
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
                              --timeout 15m \
                              -o /out/sbom-frontend.json \
                              ${DOCKER_IMAGE_FRONTEND}:latest
                              chown \$(id -u):\$(id -g) sbom-frontend.json || true

                            """

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --format table \
                              --timeout 15m \
                              --severity CRITICAL \
                              --exit-code 1 \
                              --ignore-unfixed \
                              ${DOCKER_IMAGE_FRONTEND}:latest
                            """
                        }
                    }
                    post {
                        always {
                                archiveArtifacts artifacts: '**/*.json', allowEmptyArchive: true
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
                            -Dsonar.python.version=3 \
                            -Dsonar.javascript.node.max_old_space_size=4096 \
                            -Dsonar.javascript.lcov.reportPaths=healthsentinel-frontend/coverage/lcov.info \
                            -Dsonar.python.coverage.reportPaths=healthsentinel-backend/coverage.xml \
                            -Dsonar.test.inclusions=**/*.test.tsx,**/*.spec.tsx,**/test_*.py \
                            -Dsonar.exclusions=**/node_modules/**,**/venv/**,**/sbom/**,**/.next/**,**/prisma/client/**,**/build/**
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
            rm -f healthsentinel-backend/coverage.xml healthsentinel-frontend/coverage/lcov.info || true
            docker container prune -f || true
            docker image prune -f || true
            docker builder prune -f || true
            '''
        }
    }
}
