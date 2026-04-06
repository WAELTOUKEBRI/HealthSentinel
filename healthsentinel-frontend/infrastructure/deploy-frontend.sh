#!/bin/bash

# 1. Register the new task definition
echo "🚀 Registering new Task Definition..."
aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/frontend-task-definition.json

# 2. Update the service (Force new deployment)
echo "🔄 Updating ECS Service..."
aws ecs update-service \
    --cluster healthsentinel-cluster \
    --service frontend-service \
    --task-definition healthsentinel-frontend-task \
    --force-new-deployment

echo "✅ Deployment triggered! Check AWS Console for progress."
