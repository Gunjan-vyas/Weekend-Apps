# AWS Deployment Guide

This guide walks you through deploying the Wardrobe App to AWS using ECS, ECR, and RDS.

## Prerequisites

1. AWS CLI installed and configured
2. Docker installed
3. AWS account with appropriate permissions
4. RDS PostgreSQL instance (or create one)

## Architecture

- **ECS (Fargate)**: Container orchestration
- **ECR**: Docker image registry
- **RDS**: PostgreSQL database
- **CloudWatch**: Logging
- **Secrets Manager**: Database credentials

## Setup Steps

### 1. Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier wardrobe-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username wardrobe_user \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --region us-east-1
```

Note the endpoint URL from the output.

### 2. Create Secrets Manager Secret

```bash
aws secretsmanager create-secret \
  --name wardrobe/database-url \
  --secret-string "postgresql://wardrobe_user:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/wardrobe_db" \
  --region us-east-1
```

### 3. Set Up IAM Roles

Run the setup script (update VPC and subnet IDs first):

```bash
chmod +x aws/setup.sh
./aws/setup.sh
```

Or manually:

1. Create ECS Task Execution Role with policies from `iam-task-execution-role-policy.json`
2. Create ECS Task Role with policies from `iam-task-role-policy.json`
3. Create CloudWatch Log Group: `/ecs/wardrobe-app`

### 4. Update Task Definition

Edit `ecs-task-definition.json` and replace:
- `YOUR_ACCOUNT_ID` with your AWS account ID
- `YOUR_REGION` with your AWS region

### 5. Deploy Application

```bash
chmod +x aws/deploy.sh
./aws/deploy.sh
```

This script will:
1. Build Docker image
2. Push to ECR
3. Update ECS task definition
4. Deploy to ECS service

## Manual Deployment Steps

### 1. Create ECR Repository

```bash
aws ecr create-repository --repository-name wardrobe-app --region us-east-1
```

### 2. Build and Push Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t wardrobe-app .

# Tag
docker tag wardrobe-app:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wardrobe-app:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wardrobe-app:latest
```

### 3. Register Task Definition

```bash
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json
```

### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster wardrobe-cluster \
  --service-name wardrobe-service \
  --task-definition wardrobe-app \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## Security Best Practices

1. **Database**: Use RDS in private subnet, not publicly accessible
2. **Secrets**: Store DATABASE_URL in Secrets Manager, not environment variables
3. **IAM**: Use least privilege principle for IAM roles
4. **VPC**: Deploy ECS tasks in private subnets with NAT Gateway
5. **Security Groups**: Restrict access to necessary ports only

## Monitoring

View logs:
```bash
aws logs tail /ecs/wardrobe-app --follow
```

Check service status:
```bash
aws ecs describe-services --cluster wardrobe-cluster --services wardrobe-service
```

## Troubleshooting

1. **Task fails to start**: Check CloudWatch logs
2. **Database connection issues**: Verify security groups allow traffic from ECS tasks
3. **Image pull errors**: Verify ECR permissions and image exists
4. **Secrets not accessible**: Check IAM role has Secrets Manager permissions

## Cost Optimization

- Use Fargate Spot for non-production workloads
- Right-size RDS instance based on usage
- Enable RDS automated backups
- Use CloudWatch Logs retention policies

