#!/bin/bash

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME="wardrobe-cluster"
SERVICE_NAME="wardrobe-service"
TASK_FAMILY="wardrobe-app"
VPC_ID=""  # Set your VPC ID
SUBNET_IDS=""  # Set your subnet IDs (comma-separated)
SECURITY_GROUP_ID=""  # Set your security group ID

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up AWS infrastructure...${NC}"

# Step 1: Create ECS Cluster
echo -e "${YELLOW}Step 1: Creating ECS cluster...${NC}"
aws ecs create-cluster \
  --cluster-name $CLUSTER_NAME \
  --region $AWS_REGION || echo "Cluster may already exist"

# Step 2: Create IAM roles
echo -e "${YELLOW}Step 2: Creating IAM roles...${NC}"

# Task Execution Role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "Role may already exist"

aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name ecsTaskExecutionRolePolicy \
  --policy-document file://aws/iam-task-execution-role-policy.json

# Task Role
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "Role may already exist"

aws iam put-role-policy \
  --role-name ecsTaskRole \
  --policy-name ecsTaskRolePolicy \
  --policy-document file://aws/iam-task-role-policy.json

# Step 3: Create CloudWatch Log Group
echo -e "${YELLOW}Step 3: Creating CloudWatch log group...${NC}"
aws logs create-log-group \
  --log-group-name /ecs/wardrobe-app \
  --region $AWS_REGION 2>/dev/null || echo "Log group may already exist"

# Step 4: Create Secrets Manager secret for DATABASE_URL
echo -e "${YELLOW}Step 4: Creating Secrets Manager secret...${NC}"
echo "Please create the secret manually in AWS Secrets Manager:"
echo "Name: wardrobe/database-url"
echo "Value: postgresql://username:password@your-rds-endpoint:5432/wardrobe_db"
echo ""
read -p "Press enter after creating the secret..."

# Step 5: Update task definition with correct values
echo -e "${YELLOW}Step 5: Updating task definition...${NC}"
sed "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g; s/YOUR_REGION/$AWS_REGION/g" aws/ecs-task-definition.json > aws/ecs-task-definition-updated.json

# Step 6: Register task definition
echo -e "${YELLOW}Step 6: Registering task definition...${NC}"
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-definition-updated.json \
  --region $AWS_REGION

# Step 7: Create ECS Service
if [ -z "$VPC_ID" ] || [ -z "$SUBNET_IDS" ] || [ -z "$SECURITY_GROUP_ID" ]; then
  echo -e "${RED}Please set VPC_ID, SUBNET_IDS, and SECURITY_GROUP_ID in this script${NC}"
  echo "Then run:"
  echo "aws ecs create-service \\"
  echo "  --cluster $CLUSTER_NAME \\"
  echo "  --service-name $SERVICE_NAME \\"
  echo "  --task-definition $TASK_FAMILY \\"
  echo "  --desired-count 1 \\"
  echo "  --launch-type FARGATE \\"
  echo "  --network-configuration \"awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}\" \\"
  echo "  --region $AWS_REGION"
else
  echo -e "${YELLOW}Step 7: Creating ECS service...${NC}"
  aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition $TASK_FAMILY \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
    --region $AWS_REGION
fi

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up RDS PostgreSQL instance"
echo "2. Update DATABASE_URL in Secrets Manager"
echo "3. Run deploy.sh to deploy your application"

