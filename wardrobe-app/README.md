# Wardrobe Management API

A Bun-powered API for managing your wardrobe, getting outfit recommendations, and purchase suggestions. Built with PostgreSQL, Prisma ORM, and ready for AWS deployment.

## Features

1. **Health Check** - Monitor API status
2. **Wardrobe Items** - CRUD operations for individual clothing pieces with detailed information
3. **Wardrobe Collections** - Organize items into collections
4. **Outfit Recommendations** - Get personalized outfit suggestions based on occasion and location
5. **Purchase Recommendations** - Get suggestions on what new clothes to buy

## Tech Stack

- **Bun** - Runtime and package manager
- **PostgreSQL** - Database
- **Prisma** - ORM
- **TypeScript** - Type safety
- **Docker** - Containerization
- **AWS ECS/Fargate** - Container orchestration
- **AWS ECR** - Container registry
- **AWS RDS** - Managed PostgreSQL

## Prerequisites

- Bun installed ([bun.sh](https://bun.sh))
- PostgreSQL database (local or RDS)
- Docker (for containerized deployment)
- AWS CLI (for AWS deployment)

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your database URL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/wardrobe_db
PORT=3000
NODE_ENV=development
```

### 3. Set Up Database

Generate Prisma Client:

```bash
bun run db:generate
```

Run migrations:

```bash
bun run db:migrate
```

Or push schema directly (development only):

```bash
bun run db:push
```

### 4. Start Development Server

```bash
bun run dev
```

The server will start on `http://localhost:3000`

## Development Commands

```bash
# Install dependencies
bun install

# Generate Prisma Client
bun run db:generate

# Create and run migrations
bun run db:migrate

# Push schema changes (dev only)
bun run db:push

# Deploy migrations (production)
bun run db:migrate:deploy

# Open Prisma Studio (database GUI)
bun run db:studio

# Run seed script (if exists)
bun run db:seed

# Start development server
bun run dev

# Start production server
bun run start
```

## Docker Development

### Using Docker Compose

Start PostgreSQL and the app:

```bash
docker-compose up -d
```

View logs:

```bash
docker-compose logs -f app
```

Stop services:

```bash
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t wardrobe-app .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/db \
  wardrobe-app
```

## API Endpoints

### Health Check

- `GET /healthcheck` - Check API health status

### Wardrobe Items

- `GET /wardrobe` - Get all wardrobe items
- `POST /wardrobe` - Create a new wardrobe item
- `GET /wardrobe/:id` - Get a specific wardrobe item
- `PUT /wardrobe/:id` - Update a wardrobe item
- `DELETE /wardrobe/:id` - Delete a wardrobe item

#### Wardrobe Item Schema

```json
{
  "name": "string (required)",
  "cloth_type": "string (required)",
  "gsm": "number (optional)",
  "fabric": "string (optional)",
  "color": "string (optional)",
  "size": "string (optional)",
  "brand": "string (optional)",
  "purchase_date": "string (optional)",
  "purchase_price": "number (optional)",
  "condition": "string (optional: excellent, good, fair, poor)",
  "season": "string (optional: spring, summer, fall, winter)",
  "occasion": "string (optional)",
  "location": "string (optional)",
  "notes": "string (optional)"
}
```

### Collections

- `GET /collections` - Get all collections
- `POST /collections` - Create a new collection
- `GET /collections/:id` - Get a specific collection
- `PUT /collections/:id` - Update a collection
- `DELETE /collections/:id` - Delete a collection

#### Collection Schema

```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "item_ids": "array of numbers or comma-separated string (optional)"
}
```

### Recommendations

- `POST /recommendations/outfit` - Get outfit recommendation
- `GET /recommendations/purchase` - Get purchase recommendations

#### Outfit Recommendation Request

```json
{
  "occasion": "string (required)",
  "location": "string (required)",
  "weather": "string (optional)",
  "season": "string (optional)",
  "color_preference": "string (optional)"
}
```

## Example Usage

### Create a Wardrobe Item

```bash
curl -X POST http://localhost:3000/wardrobe \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blue Denim Jeans",
    "cloth_type": "jeans",
    "fabric": "denim",
    "color": "blue",
    "size": "32",
    "brand": "Levi'\''s",
    "purchase_date": "2024-01-15",
    "condition": "good",
    "season": "all-season",
    "occasion": "casual",
    "location": "outdoor"
  }'
```

### Get Outfit Recommendation

```bash
curl -X POST http://localhost:3000/recommendations/outfit \
  -H "Content-Type: application/json" \
  -d '{
    "occasion": "casual",
    "location": "outdoor",
    "season": "summer"
  }'
```

### Get Purchase Recommendations

```bash
curl http://localhost:3000/recommendations/purchase
```

## AWS Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. RDS PostgreSQL instance created
3. ECR repository created
4. ECS cluster created
5. VPC, subnets, and security groups configured

### Quick Deployment

1. **Set up infrastructure** (first time only):

   ```bash
   cd aws
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Deploy application**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Manual Deployment Steps

See [AWS Deployment Guide](./aws/README.md) for detailed instructions.

### Deployment Order

1. **Create RDS PostgreSQL Instance**

   ```bash
   aws rds create-db-instance \
     --db-instance-identifier wardrobe-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username wardrobe_user \
     --master-user-password YOUR_PASSWORD \
     --allocated-storage 20
   ```

2. **Create Secrets Manager Secret**

   ```bash
   aws secretsmanager create-secret \
     --name wardrobe/database-url \
     --secret-string "postgresql://user:password@rds-endpoint:5432/db"
   ```

3. **Set up IAM Roles** (see `aws/setup.sh`)

4. **Build and Push Docker Image**

   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin \
     YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

   # Build and push
   docker build -t wardrobe-app .
   docker tag wardrobe-app:latest \
     YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wardrobe-app:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wardrobe-app:latest
   ```

5. **Register Task Definition**

   ```bash
   # Update aws/ecs-task-definition.json with your account ID and region
   aws ecs register-task-definition \
     --cli-input-json file://aws/ecs-task-definition.json
   ```

6. **Create/Update ECS Service**
   ```bash
   aws ecs create-service \
     --cluster wardrobe-cluster \
     --service-name wardrobe-service \
     --task-definition wardrobe-app \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
   ```

## Project Structure

```
wardrobe-app/
├── src/
│   ├── index.ts              # Main server file
│   ├── db.ts                 # Prisma database client and functions
│   ├── types.ts              # TypeScript type definitions
│   ├── routes/               # Route handlers
│   │   ├── healthcheck.ts
│   │   ├── wardrobe.ts
│   │   ├── collections.ts
│   │   └── recommendations.ts
│   └── services/             # Business logic
│       └── recommendation.ts
├── prisma/
│   └── schema.prisma         # Database schema
├── aws/                      # AWS deployment files
│   ├── ecs-task-definition.json
│   ├── iam-task-execution-role-policy.json
│   ├── iam-task-role-policy.json
│   ├── setup.sh
│   ├── deploy.sh
│   └── README.md
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

The application uses Prisma ORM with PostgreSQL. The schema includes:

- **WardrobeItem**: Individual clothing items with all details
- **WardrobeCollection**: Collections of wardrobe items

See `prisma/schema.prisma` for the complete schema definition.

## Environment Variables

| Variable       | Description                          | Required | Default     |
| -------------- | ------------------------------------ | -------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string         | Yes      | -           |
| `PORT`         | Server port                          | No       | 3000        |
| `NODE_ENV`     | Environment (development/production) | No       | development |

## Security Best Practices

1. **Never commit `.env` file** - Use `.env.example` as template
2. **Use Secrets Manager** - Store sensitive data in AWS Secrets Manager for production
3. **Database Security** - Use RDS in private subnet, restrict access
4. **IAM Roles** - Use least privilege principle
5. **Security Groups** - Restrict to necessary ports only

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running and accessible
- Verify network/security group rules allow connections

### Prisma Issues

- Run `bun run db:generate` after schema changes
- Run `bun run db:migrate` to apply migrations
- Check Prisma logs: `prisma migrate dev --create-only`

### Docker Issues

- Ensure Docker daemon is running
- Check container logs: `docker-compose logs app`
- Verify environment variables are set correctly

### AWS Deployment Issues

- Check CloudWatch logs: `aws logs tail /ecs/wardrobe-app --follow`
- Verify ECS task is running: `aws ecs describe-tasks --cluster wardrobe-cluster`
- Check IAM role permissions
- Verify Secrets Manager secret exists and is accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (if applicable)
5. Submit a pull request

## License

MIT
