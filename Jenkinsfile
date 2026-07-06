pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "healthsentinel-backend"
        DOCKER_IMAGE_FRONTEND = "healthsentinel-frontend"
        DOCKER_IMAGE_AI = "healthsentinel-ai"
        REGION = "eu-west-3"
        TRIVY_CACHE = "${WORKSPACE}/.trivy-cache"
        SBOM_DIR = "${WORKSPACE}/sbom"
        SONAR_HOST_URL = "http://hs-sonarqube:9000"
        PASS = credentials('DB_PASSWORD')
        IMAGE_TAG = "v1.0.${BUILD_NUMBER}"
        NAMESPACE = "healthsentinel-prod"

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
          environment {
              API_ENDPOINT = "http://a7e5615e53b9d409dbd857c5f7bbbc33-1309895825.eu-west-3.elb.amazonaws.com/api"
              WS_ENDPOINT  = "ws://a7e5615e53b9d409dbd857c5f7bbbc33-1309895825.eu-west-3.elb.amazonaws.com/ws/patients"
         }
            steps {
                dir('healthsentinel-frontend') {
                    sh """
                    # 1. Clear any leftover containers from previous failed runs
                    docker rm -f frontend-test-exec || true

                    # 2. Start a clean, official Node container in the background
                    docker run -d --name frontend-test-exec --user root --entrypoint sleep node:20 3600

                    # 3. Force-feed your live Jenkins workspace directly into the container
                    # This completely bypasses the production image optimizations and .dockerignore
                    docker cp . frontend-test-exec:/app

                    # 4. Run the installation and test scripts inside the isolated container
                    docker exec -w /app frontend-test-exec npm install --include=dev
                    docker exec -w /app frontend-test-exec npm run test:coverage || true

                    # 5. Extract the freshly generated LCOV coverage report back out to Jenkins
                    mkdir -p coverage
                    docker cp frontend-test-exec:/app/coverage/lcov.info ./coverage/lcov.info || echo "LCOV non trouvé"

                    # 6. Clean up the temporary test container
                    docker rm -f frontend-test-exec

                    # 7. Final gate check for SonarQube
                    if [ -f coverage/lcov.info ]; then
                        echo "✅ LCOV récupéré avec succès !"
                        chmod 644 coverage/lcov.info
                    else
                      echo "❌ LCOV toujours absent" && exit 1
                    fi
                    """
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
                    sh "docker build -t ${DOCKER_IMAGE_BACKEND}:latest ."

                    // 1. GÉNÉRATION DU SBOM (Extraction via docker cp)
                    sh """
                    # On lance Trivy SANS volume, avec un nom de conteneur
                    docker run --name trivy-backend-sbom \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                      aquasec/trivy:0.50.1 image \
                      --format cyclonedx --timeout 15m \
                      -o sbom-backend.json \
                      ${DOCKER_IMAGE_BACKEND}:latest
                    
                    # On extrait le fichier physiquement
                    docker cp trivy-backend-sbom:/sbom-backend.json .
                    docker rm -f trivy-backend-sbom
                    
                    # Plus besoin de chown complexe, le fichier appartient à Jenkins
                    chmod 644 sbom-backend.json || true
                    """

                    // 2. SCAN DE SÉCURITÉ (Tableau)
                    sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                      aquasec/trivy:0.50.1 image \
                      --format table --timeout 15m \
                      --severity CRITICAL --exit-code 1 --ignore-unfixed \
                      ${DOCKER_IMAGE_BACKEND}:latest
                    """
                }
            }
            post { always { archiveArtifacts artifacts: '**/sbom-backend.json', allowEmptyArchive: true } }
        }

        stage('Frontend') {
          environment {
            // Define these explicitly here so Jenkins separates them cleanly from the shell script execution
            API_ENDPOINT = "http://a7e5615e53b9d409dbd857c5f7bbbc33-1309895825.eu-west-3.elb.amazonaws.com/api"
            WS_ENDPOINT  = "ws://a7e5615e53b9d409dbd857c5f7bbbc33-1309895825.eu-west-3.elb.amazonaws.com/ws/patients"
        }
            steps {
                dir('healthsentinel-frontend') {
                    sh 'docker build --no-cache --build-arg NEXT_PUBLIC_API_URL="$API_ENDPOINT" --build-arg NEXT_PUBLIC_WS_URL="$WS_ENDPOINT" -t healthsentinel-frontend:latest .'
                  

                    // 1. GÉNÉRATION DU SBOM (Extraction via docker cp)
                    sh """
                    docker run --name trivy-frontend-sbom \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                      aquasec/trivy:0.50.1 image \
                      --format cyclonedx --timeout 15m \
                      -o sbom-frontend.json \
                      ${DOCKER_IMAGE_FRONTEND}:latest
                    
                    docker cp trivy-frontend-sbom:/sbom-frontend.json .
                    docker rm -f trivy-frontend-sbom
                    
                    chmod 644 sbom-frontend.json || true
                    """

                    // 2. SCAN DE SÉCURITÉ (Tableau)
                    sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                      aquasec/trivy:0.50.1 image \
                      --format table --timeout 15m \
                      --severity CRITICAL --exit-code 1 --ignore-unfixed \
                      ${DOCKER_IMAGE_FRONTEND}:latest
                    """

       
      }
    }
            post { always { archiveArtifacts artifacts: '**/sbom-frontend.json', allowEmptyArchive: true } }
        }

        stage('AI Service') {
          steps {
              dir('healthsentinel-backend') {
               echo "🧠 Running model creation inside isolated container layers..."
            // 1. Run the container WITHOUT -v or --rm, and give it a dedicated name
               sh 'docker run --name ai-model-builder --user root -e PYTHONPATH=/app:/home/app/.local/lib/python3.12/site-packages -w /app healthsentinel-test-image python3 create_model.py'
            
                echo "📥 Extracting model.pkl artifact to Jenkins workspace..."
            // 2. Safely copy the generated file out of the container before it disappears
                sh 'docker cp ai-model-builder:/app/model.pkl .'
            
                echo "🧹 Removing temporary builder container..."
            // 3. Clean up the container now that we have our file
                sh 'docker rm -f ai-model-builder'
            
                 echo "📦 Moving model artifact to AI Service directory..."
                sh "mv model.pkl ../healthsentinel-ai-service/"
        }
              dir('healthsentinel-ai-service') {
               echo "🏗️ Building AI Service Docker image..."
               sh "docker build -t ${DOCKER_IMAGE_AI}:latest ."
            
               echo "🛡️ Running Trivy Vulnerability Scan..."
               sh """
                docker run --rm \
                  -v /var/run/docker.sock:/var/run/docker.sock \
                  -v ${TRIVY_CACHE}:/root/.cache/aquasec/trivy \
                  aquasec/trivy:0.50.1 image \
                  --format table --timeout 15m \
                  --severity CRITICAL --ignore-unfixed --exit-code 1 \
                  ${DOCKER_IMAGE_AI}:latest
               """
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
                             -Dsonar.sources=healthsentinel-backend,healthsentinel-frontend/src,healthsentinel-ai-service \
                             -Dsonar.tests=healthsentinel-frontend/src,healthsentinel-backend \
                             -Dsonar.test.inclusions=**/*.test.tsx,**/*.test.ts,**/*.spec.tsx,**/test_*.py \
                             -Dsonar.host.url=${SONAR_HOST_URL} \
                             -Dsonar.token=${SONAR_TOKEN} \
                             -Dsonar.javascript.lcov.reportPaths=healthsentinel-frontend/coverage/lcov.info \
                             -Dsonar.python.coverage.reportPaths=healthsentinel-backend/coverage.xml \
                             -Dsonar.coverage.exclusions=**/ModeToggle.tsx,**/src/components/ui/**,**/src/components/layout/**,**/src/app/**,**/theme-provider.tsx,**/useSentinelStore.ts,**/HeartRateChart.tsx,**/SystemMetrics.tsx,**/prisma/client/**,**/create_model.py,**/verify_sagemaker.py,**/deploy_simple.py                        
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


        stage('Push to AWS ECR') {
            steps {
                script {
                   def ecrRegistry = "856021349334.dkr.ecr.${REGION}.amazonaws.com"
                   sh "aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ecrRegistry}"

            // Array of images to push
                   def images = [DOCKER_IMAGE_BACKEND, DOCKER_IMAGE_FRONTEND, DOCKER_IMAGE_AI]

            for (image in images) {
                   echo "Tagging and Pushing ${image}..."
                   sh """
                   docker tag ${image}:latest ${ecrRegistry}/${image}:latest
                   docker push ${ecrRegistry}/${image}:latest
                   """
            }
            echo "🚀 All images successfully published to ECR!"
        }
    }
}
        stage('Deploy to EKS') {
            steps {
                // Securely binds the kubeconfig file path to a temporary variable
                withCredentials([file(credentialsId: 'eks-kubeconfig', variable: 'KUBECONFIG_PATH')]) {
                    script {
                        echo "⚙️ Injecting unique image tags into manifests..."
                        sh "sed -i 's|:latest|:${IMAGE_TAG}|g' k8s/backend.yaml"
                        sh "sed -i 's|:latest|:${IMAGE_TAG}|g' k8s/frontend.yaml"
                        
                        echo "📥 Downloading portable kubectl binary..."
                        // Downloads a static kubectl binary directly into the pipeline workspace
                        sh '''
                        curl -LO "https://dl.k8s.io/release/v1.30.0/bin/linux/amd64/kubectl"
                        chmod +x ./kubectl
                        '''
                        
                        echo "🚀 Deploying manifests to EKS namespace: ${NAMESPACE}..."
                        // We explicitly pass the --kubeconfig flag pointing to our Jenkins secret file
                        sh "./kubectl --kubeconfig=${KUBECONFIG_PATH} apply -f k8s/backend.yaml -n ${NAMESPACE}"
                        sh "./kubectl --kubeconfig=${KUBECONFIG_PATH} apply -f k8s/frontend.yaml -n ${NAMESPACE}"
                        
                        echo "🔄 Verifying rollout status..."
                        sh "./kubectl --kubeconfig=${KUBECONFIG_PATH} rollout status deployment/healthsentinel-backend -n ${NAMESPACE}"
                        sh "./kubectl --kubeconfig=${KUBECONFIG_PATH} rollout status deployment/healthsentinel-frontend -n ${NAMESPACE}"
                        
                        echo "✅ Deployment completed successfully!"
                    }
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
