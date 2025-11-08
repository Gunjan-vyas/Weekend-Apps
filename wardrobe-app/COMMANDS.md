# Commands Reference

This document lists all commands in the proper order for setup and deployment.

## Local Development Setup

### 1. Initial Setup

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env file with your database URL
# DATABASE_URL=postgresql://user:password@localhost:5432/wardrobe_db
```

### 2. Database Setup

```bash
# Generate Prisma Client
bun run db:generate

# Create initial migration
bun run db:migrate

# Or push schema directly (development only)
bun run db:push
```

### 3. Start Development Server

```bash
# Start server
bun run dev
```

### 4. Database Management

```bash
# Open Prisma Studio (database GUI)
bun run db:studio

# Create new migration
bun run db:migrate

# Seed database (if seed script exists)
bun run db:seed
```

## Docker Development

### Using Docker Compose

```bash
# Start all services (PostgreSQL + App)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

### Manual Docker Commands

```bash
# Build image
docker build -t wardrobe-app .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/db \
  -e PORT=3000 \
  wardrobe-app
```

## AWS Deployment - Complete Setup Order

### Prerequisites Check

```bash
# Verify AWS CLI is installed and configured
aws --version
aws sts get-caller-identity

# Verify Docker is running
docker --version
```

### Step 1: Create RDS PostgreSQL Instance

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier wardrobe-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username wardrobe_user \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --region us-east-1

# Wait for instance to be available (takes 5-10 minutes)
aws rds describe-db-instances \
  --db-instance-identifier wardrobe-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Get endpoint URL
aws rds describe-db-instances \
  --db-instance-identifier wardrobe-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Step 2: Create Secrets Manager Secret

```bash
# Create secret for database URL
aws secretsmanager create-secret \
  --name wardrobe/database-url \
  --description "Database connection string for wardrobe app" \
  --secret-string "postgresql://wardrobe_user:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/wardrobe_db" \
  --region us-east-1

# Verify secret was created
aws secretsmanager describe-secret \
  --secret-id wardrobe/database-url
```

### Step 3: Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name wardrobe-app \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true

# Get repository URI
aws ecr describe-repositories \
  --repository-names wardrobe-app \
  --query 'repositories[0].repositoryUri' \
  --output text
```

### Step 4: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name wardrobe-cluster \
  --region us-east-1
```

### Step 5: Create IAM Roles

```bash
# Create Task Execution Role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policy to Task Execution Role
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name ecsTaskExecutionRolePolicy \
  --policy-document file://aws/iam-task-execution-role-policy.json

# Create Task Role
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policy to Task Role
aws iam put-role-policy \
  --role-name ecsTaskRole \
  --policy-name ecsTaskRolePolicy \
  --policy-document file://aws/iam-task-role-policy.json
```

### Step 6: Create CloudWatch Log Group

```bash
# Create log group
aws logs create-log-group \
  --log-group-name /ecs/wardrobe-app \
  --region us-east-1
```

### Step 7: Build and Push Docker Image

```bash
# Get AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image
docker build -t wardrobe-app .

# Tag image
docker tag wardrobe-app:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/wardrobe-app:latest

# Push image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/wardrobe-app:latest
```

### Step 8: Update Task Definition

```bash
# Update task definition with your account ID and region
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# Replace placeholders
sed "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g; s/YOUR_REGION/$AWS_REGION/g" \
  aws/ecs-task-definition.json > aws/ecs-task-definition-updated.json

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-definition-updated.json \
  --region $AWS_REGION
```

### Step 9: Create ECS Service

```bash
# Set variables
export CLUSTER_NAME=wardrobe-cluster
export SERVICE_NAME=wardrobe-service
export TASK_FAMILY=wardrobe-app
export SUBNET_IDS=subnet-xxx,subnet-yyy  # Replace with your subnet IDs
export SECURITY_GROUP_ID=sg-xxx  # Replace with your security group ID

# Create service
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --task-definition $TASK_FAMILY \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
  --region us-east-1
```

### Step 10: Verify Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster wardrobe-cluster \
  --services wardrobe-service \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'

# View logs
aws logs tail /ecs/wardrobe-app --follow

# Get task ARN
aws ecs list-tasks \
  --cluster wardrobe-cluster \
  --service-name wardrobe-service \
  --query 'taskArns[0]' \
  --output text
```

## Automated Deployment (Using Scripts)

### First Time Setup

```bash
# Make scripts executable (Linux/Mac)
chmod +x aws/setup.sh aws/deploy.sh

# Run setup (creates cluster, IAM roles, etc.)
cd aws
./setup.sh
```

### Deploy Application

```bash
# Deploy new version
cd aws
./deploy.sh
```

## Updating Application

### After Code Changes

```bash
# 1. Build and push new image
./aws/deploy.sh

# Or manually:
docker build -t wardrobe-app .
docker tag wardrobe-app:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/wardrobe-app:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/wardrobe-app:latest

# 2. Update service (forces new deployment)
aws ecs update-service \
  --cluster wardrobe-cluster \
  --service wardrobe-service \
  --force-new-deployment
```

## Database Migrations in Production

```bash
# Run migrations in production
# Option 1: Run in ECS task
aws ecs run-task \
  --cluster wardrobe-cluster \
  --task-definition wardrobe-app \
  --overrides '{
    "containerOverrides": [{
      "name": "wardrobe-app",
      "command": ["bun", "run", "db:migrate:deploy"]
    }]
  }'

# Option 2: Run locally with production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/db"
bun run db:migrate:deploy
```

## Monitoring and Debugging

```bash
# View application logs
aws logs tail /ecs/wardrobe-app --follow

# Check service events
aws ecs describe-services \
  --cluster wardrobe-cluster \
  --services wardrobe-service \
  --query 'services[0].events[:5]'

# Describe running tasks
aws ecs describe-tasks \
  --cluster wardrobe-cluster \
  --tasks $(aws ecs list-tasks --cluster wardrobe-cluster --service-name wardrobe-service --query 'taskArns[0]' --output text)

# Check task health
aws ecs describe-tasks \
  --cluster wardrobe-cluster \
  --tasks TASK_ARN \
  --query 'tasks[0].healthStatus'
```

## Cleanup Commands

```bash
# Stop service
aws ecs update-service \
  --cluster wardrobe-cluster \
  --service wardrobe-service \
  --desired-count 0

# Delete service
aws ecs delete-service \
  --cluster wardrobe-cluster \
  --service wardrobe-service \
  --force

# Delete cluster
aws ecs delete-cluster --cluster wardrobe-cluster

# Delete ECR repository
aws ecr delete-repository \
  --repository-name wardrobe-app \
  --force

# Delete RDS instance (careful!)
aws rds delete-db-instance \
  --db-instance-identifier wardrobe-db \
  --skip-final-snapshot
```

## Common Issues and Solutions

### Image Pull Errors
```bash
# Verify ECR repository exists
aws ecr describe-repositories --repository-names wardrobe-app

# Check IAM role has ECR permissions
aws iam get-role-policy --role-name ecsTaskExecutionRole --policy-name ecsTaskExecutionRolePolicy
```

### Database Connection Errors
```bash
# Verify security group allows traffic from ECS tasks
# Check RDS endpoint is correct
# Verify DATABASE_URL in Secrets Manager
aws secretsmanager get-secret-value --secret-id wardrobe/database-url
```

### Task Fails to Start
```bash
# Check CloudWatch logs
aws logs tail /ecs/wardrobe-app --follow

# Check task definition
aws ecs describe-task-definition --task-definition wardrobe-app
```

