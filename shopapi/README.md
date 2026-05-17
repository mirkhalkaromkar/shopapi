# ShopAPI

E-commerce product catalog API built with Node.js + Express.  
Designed to mirror a production GCP architecture, deployed phase-by-phase on AWS Free Tier.

## Architecture

```
Client → ALB → EC2 (Node.js) → Redis (cache-aside) → RDS MySQL
                             → SQS (async events)
                             → S3 + CloudFront (static assets)
```

## Local development

```bash
# 1. Copy env file
cp .env.example .env

# 2. Start MySQL + Redis + App
docker compose up --build

# 3. API is live at
http://localhost:3000
```

## API endpoints

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | /health                   | Health check                       |
| GET    | /products                 | List all products (cached)         |
| GET    | /products/:id             | Get product by ID (cached)         |
| POST   | /products                 | Create product + publish SQS event |
| PUT    | /products/:id             | Update product + invalidate cache  |
| DELETE | /products/:id             | Delete product + invalidate cache  |
| GET    | /categories               | List categories (cached)           |
| GET    | /categories/:id/products  | Products by category (cached)      |

## AWS deployment phases

| Phase | What gets added                        |
|-------|----------------------------------------|
| 1     | VPC + EC2 + RDS (MySQL)                |
| 2     | S3 + CloudFront + ALB + SSM secrets    |
| 3     | Redis on EC2 + SQS queue + worker      |
| 4     | CloudWatch logs + metrics + alarms     |
| 5     | CodePipeline + CodeBuild + CodeDeploy  |
| 6     | Multi-AZ RDS + Auto Scaling Group + DR |

## Cache strategy

Cache-aside pattern with Redis:
- `products:all` — TTL 5 min
- `products:{id}` — TTL 10 min
- `categories:all` — TTL 10 min
- Cache invalidated on every write (POST / PUT / DELETE)

## SQS events

| Event             | Trigger             | Worker action         |
|-------------------|---------------------|-----------------------|
| PRODUCT_CREATED   | POST /products      | Inventory check, notify |
| PRODUCT_UPDATED   | PUT /products/:id   | Re-index              |
| PRODUCT_DELETED   | DELETE /products/:id| Remove from index     |
