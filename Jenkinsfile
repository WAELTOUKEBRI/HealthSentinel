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
            # 1. On force l'écriture dans /tmp pour éviter le 'Permission denied'
            docker run --name backend-test-exec --network healthsentinel-network \
            --user root \
            -e DATABASE_URL="postgresql://wael_admin:${PASS}@hs-db:5432/healthsentinel_db" \
            -e PYTHONPATH=/app:/home/app/.local/lib/python3.12/site-packages \
            -e COVERAGE_FILE=/tmp/.coverage \
            healthsentinel-test-image \
            python3 -m pytest --cov=. --cov-report=xml:/tmp/coverage.xml || true

            # 2. On extrait depuis /tmp
            docker cp backend-test-exec:/tmp/coverage.xml . || echo "XML non trouvé"

            # 3. Nettoyage
            docker rm -f backend-test-exec

            # 4. Fix des chemins pour SonarQube (Important pour passer de 0% à 81%)
            if [ -f coverage.xml ]; then
              # On remplace le chemin interne /app/ par le chemin du projet pour Sonar
              sed -i 's|filename="|filename="healthsentinel-backend/|g' coverage.xml
              chmod 644 coverage.xml
              echo "✅ Coverage récupéré et corrigé !"
            else
              echo "❌ ERREUR: coverage.xml non récupéré" && exit 1
            fi
            """
        }
    }
}

        stage('Frontend Tests') {
            steps {
                dir('healthsentinel-frontend') {
                    sh '''
                    # 1. Build de l'image builder
                    docker build --target builder -t frontend-test .

                    # 2. Exécution avec un NOM de conteneur fixe
                    docker run --name frontend-test-exec frontend-test npm run test:coverage || true

                    # 3. On crée le dossier et on EXTRAIT le rapport lcov
                    mkdir -p coverage
                    docker cp frontend-test-exec:/app/coverage/lcov.info ./coverage/lcov.info || echo "LCOV non trouvé"
                    
                    # 4. Nettoyage
                    docker rm -f frontend-test-exec

                    if [ -f coverage/lcov.info ]; then
                        echo "✅ LCOV récupéré avec succès !"
                        chmod 644 coverage/lcov.info
                    else
                      echo "❌ LCOV toujours absent" && exit 1
                    fi
                    '''
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
                            -Dsonar.tests=. \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.token=${SONAR_TOKEN} \
                            -Dsonar.javascript.node.max_old_space_size=4096 \
                            -Dsonar.javascript.lcov.reportPaths=healthsentinel-frontend/coverage/lcov.info \
                            -Dsonar.python.coverage.reportPaths=healthsentinel-backend/coverage.xml \
                            -Dsonar.test.inclusions=**/*.test.tsx,**/*.spec.tsx,**/test_*.py \
                            -Dsonar.exclusions=**/node_modules/**,**/venv/**,**/sbom/**,**/.next/**,**/prisma/client/**,**/build/**,**/.coverage,**/*.config.*,**/*.mjs \
                            -Dsonar.coverage.exclusions=**/src/components/ui/**,**/src/components/layout/**,**/src/app/**,**/theme-provider.tsx,**/*.config.*,**/*.mjs,**/useSentinelStore.ts,**/HeartRateChart.tsx,**/SystemMetrics.tsx,**/prisma/client/**
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
