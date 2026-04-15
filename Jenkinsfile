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

        /* =========================
           SECURITY ANALYSIS
        ========================= */
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

        /* =========================
           DOCKER LINT (NON-BLOCKING)
        ========================= */
        stage('Docker Lint') {
            steps {
                sh '''
                echo "Hadolint backend"
                docker run --rm -i hadolint/hadolint \
                hadolint --ignore DL3008 --ignore DL3013 \
                - < healthsentinel-backend/Dockerfile || true

                echo "Hadolint frontend"
                docker run --rm -i hadolint/hadolint \
                hadolint --ignore DL3008 --ignore DL3016 \
                - < healthsentinel-frontend/Dockerfile || true
                '''
            }
        }

        /* =========================
           PRISMA VALIDATION
        ========================= */
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

        /* =========================
           BUILD + SECURITY SCAN
        ========================= */
        stage('Build & Scan') {
            parallel {

                /* ================= BACKEND ================= */
                stage('Backend') {
                    steps {
                        dir('healthsentinel-backend') {

                            sh "docker build --no-cache -t ${DOCKER_IMAGE_BACKEND}:latest ."

                            /* ===== SBOM ===== */
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v ${WORKSPACE}/healthsentinel-backend:/out \
                            aquasec/trivy:0.50.1 image \
                            --scanners vuln \
                            --format cyclonedx \
                            --output /out/sbom-backend.json \
                            ${DOCKER_IMAGE_BACKEND}:latest
                            '''

                            /* DEBUG + VALIDATION */
                            sh '''
                            echo "📂 Backend workspace content:"
                            ls -lah

                            if [ ! -f sbom-backend.json ]; then
                                echo "❌ SBOM BACKEND NOT GENERATED"
                                exit 1
                            fi
                            '''

                            archiveArtifacts artifacts: 'sbom-backend.json', fingerprint: true

                            /* ===== CRITICAL GATE ===== */
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:0.50.1 image \
                            --severity CRITICAL \
                            --exit-code 1 \
                            ${DOCKER_IMAGE_BACKEND}:latest
                            '''

                            /* ===== HIGH REPORT ===== */
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

                /* ================= FRONTEND ================= */
                stage('Frontend') {
                    steps {
                        dir('healthsentinel-frontend') {

                            sh "docker build --no-cache -t ${DOCKER_IMAGE_FRONTEND}:latest ."

                            /* ===== SBOM ===== */
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v ${WORKSPACE}/healthsentinel-frontend:/out \
                            aquasec/trivy:0.50.1 image \
                            --scanners vuln \
                            --format cyclonedx \
                            --output /out/sbom-frontend.json \
                            ${DOCKER_IMAGE_FRONTEND}:latest
                            '''

                            /* DEBUG + VALIDATION */
                            sh '''
                            echo "📂 Frontend workspace content:"
                            ls -lah

                            if [ ! -f sbom-frontend.json ]; then
                                echo "❌ SBOM FRONTEND NOT GENERATED"
                                exit 1
                            fi
                            '''

                            archiveArtifacts artifacts: 'sbom-frontend.json', fingerprint: true

                            /* ===== CRITICAL GATE ===== */
                            sh '''
                            docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:0.50.1 image \
                            --severity CRITICAL \
                            --exit-code 1 \
                            ${DOCKER_IMAGE_FRONTEND}:latest
                            '''

                            /* ===== HIGH REPORT ===== */
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

        /* =========================
           SONARQUBE
        ========================= */
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

    /* =========================
       CLEANUP
    ========================= */
    post {
        always {
            sh '''
            echo "🧹 Cleanup Docker environment"
            docker container prune -f || true
            docker image prune -f || true
            docker builder prune -f || true
            '''
        }
    }
}
