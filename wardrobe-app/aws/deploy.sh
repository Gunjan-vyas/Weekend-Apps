#!/bin/bash

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="wardrobe-app"
ECS_CLUSTER="wardrobe-cluster"
ECS_SERVICE="wardrobe-service"
ECS_TASK_FAMILY="wardrobe-app"
IMAGE_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

# Step 1: Login to ECR
echo -e "${YELLOW}Step 1: Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 2: Create ECR repository if it doesn't exist
echo -e "${YELLOW}Step 2: Ensuring ECR repository exists...${NC}"
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Step 3: Build Docker image
echo -e "${YELLOW}Step 3: Building Docker image...${NC}"
docker build -t $ECR_REPOSITORY:$IMAGE_TAG .

# Step 4: Tag image
echo -e "${YELLOW}Step 4: Tagging image...${NC}"
docker tag $ECR_REPOSITORY:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

# Step 5: Push image to ECR
echo -e "${YELLOW}Step 5: Pushing image to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

# Step 6: Update ECS task definition
echo -e "${YELLOW}Step 6: Updating ECS task definition...${NC}"
# Replace placeholders in task definition
sed "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g; s/YOUR_REGION/$AWS_REGION/g" aws/ecs-task-definition.json > aws/ecs-task-definition-temp.json

# Register new task definition
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-definition-temp.json \
  --region $AWS_REGION

# Get latest task definition revision
TASK_DEFINITION_REVISION=$(aws ecs describe-task-definition \
  --task-definition $ECS_TASK_FAMILY \
  --region $AWS_REGION \
  --query 'taskDefinition.revision' \
  --output text)

# Step 7: Update ECS service
echo -e "${YELLOW}Step 7: Updating ECS service...${NC}"
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --task-definition $ECS_TASK_FAMILY:$TASK_DEFINITION_REVISION \
  --force-new-deployment \
  --region $AWS_REGION

# Cleanup temp file
rm -f aws/ecs-task-definition-temp.json

echo -e "${GREEN}Deployment initiated! Check ECS console for status.${NC}"
echo -e "${YELLOW}To view logs:${NC}"
echo "aws logs tail /ecs/wardrobe-app --follow --region $AWS_REGION"

