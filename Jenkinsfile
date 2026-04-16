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
                        sh """
                        docker run --rm \
                        -v ${WORKSPACE}:/src \
                        -w /src/healthsentinel-backend \
                        cytopia/bandit -r . --exclude ./venv -ll -f json -o /src/healthsentinel-backend/bandit-report.json
                        """

                        // Optional: This makes the report visible in the Jenkins UI
                        archiveArtifacts artifacts: 'healthsentinel-backend/bandit-report.json', allowEmptyArchive: true
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

                            sh """
                            mkdir -p ${SBOM_DIR}

                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              -v ${SBOM_DIR}:/out \
                              aquasec/trivy:0.50.1 image \
                              --format cyclonedx \
                              -o /out/sbom-backend.json \
                              ${DOCKER_IMAGE_BACKEND}:latest
                            """

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --severity CRITICAL \
                              --exit-code 1 \
                              --ignore-unfixed \
                              --ignorefile .trivyignore \
                              ${DOCKER_IMAGE_BACKEND}:latest
                            """
                            // 3. Archive the results
                            archiveArtifacts artifacts: 'sbom-backend.json', allowEmptyArchive: true

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --severity HIGH \
                              --ignore-unfixed \
                              --ignorefile .trivyignore \
                              --format table \
                              ${DOCKER_IMAGE_BACKEND}:latest
                            """
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
                            mkdir -p ${SBOM_DIR}

                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              -v ${SBOM_DIR}:/out \
                              aquasec/trivy:0.50.1 image \
                              --format cyclonedx \
                              -o /out/sbom-frontend.json \
                              ${DOCKER_IMAGE_FRONTEND}:latest
                            """

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --severity CRITICAL \
                              --exit-code 1 \
                              --ignore-unfixed \
                              --ignorefile .trivyignore \
                              ${DOCKER_IMAGE_FRONTEND}:latest
                            """

                            sh """
                            docker run --rm \
                              -v /var/run/docker.sock:/var/run/docker.sock \
                              -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                              aquasec/trivy:0.50.1 image \
                              --severity HIGH \
                              --ignore-unfixed \
                              --ignorefile .trivyignore \
                              --format table \
                              ${DOCKER_IMAGE_FRONTEND}:latest
                            """

                            // 5. Archive the reports for the Jenkins UI
                            archiveArtifacts artifacts: 'sbom-frontend.json', allowEmptyArchive: true
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

                            sh '''
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=HealthSentinel \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.token=$SONAR_TOKEN \
                            -Dsonar.python.version=3 \
                            -Dsonar.javascript.node.max_old_space_size=4096 \
                            -Dsonar.exclusions=**/node_modules/**,**/venv/**,terraform/**,**/sbom/**
                            '''
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
