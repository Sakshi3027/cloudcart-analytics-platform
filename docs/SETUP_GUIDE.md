# Complete Setup Guide

Step-by-step guide to set up and run the CloudCart Analytics Platform locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Testing the Platform](#testing-the-platform)
- [Troubleshooting](#troubleshooting)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

1. **Docker Desktop** (20.x or higher)
   - Download: https://www.docker.com/products/docker-desktop
   - Minimum RAM: 8GB (16GB recommended)
   - Disk Space: 10GB free

2. **Git** (2.x or higher)
   - Download: https://git-scm.com/downloads

### Optional (for local development)

3. **Node.js** (20.x LTS)
   - Download: https://nodejs.org/

4. **Python** (3.11+)
   - Download: https://www.python.org/downloads/

5. **VS Code** (recommended IDE)
   - Download: https://code.visualstudio.com/

### Verify Installation
```bash
# Check Docker
docker --version
docker-compose --version

# Check Git
git --version

# Optional: Check Node.js and Python
node --version
npm --version
python3 --version
```

---

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cloudcart-platform.git
cd cloudcart-platform
```

### 2. Start All Services
```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

**Wait 2-3 minutes for all services to start.**

### 3. Verify Services
```bash
# Check all containers are running
docker-compose ps

# Check health endpoints
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:3003/health  # Order Service
curl http://localhost:3004/health  # Analytics Service
```

### 4. Test the Platform

See [Testing the Platform](#testing-the-platform) section below.

---

## Detailed Setup

### Step 1: Project Structure

After cloning, your directory should look like:
```
cloudcart-platform/
├── services/
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   └── analytics-service/
├── docs/
├── docker-compose.yml
└── README.md
```

### Step 2: Environment Configuration

Each service has its own `.env` file with default values. For local development, these work out of the box.

**To customize (optional):**
```bash
# User Service
cd services/user-service
nano .env
# Change JWT_SECRET, ports, etc.

# Repeat for other services
```

### Step 3: Understanding Docker Compose

The `docker-compose.yml` orchestrates 9 containers:

**Databases:**
1. `user-postgres` (port 5432)
2. `product-postgres` (port 5433)
3. `order-postgres` (port 5434)
4. `clickhouse` (ports 8123, 9001)

**Infrastructure:**
5. `redis` (port 6379)
6. `zookeeper` (port 2181)
7. `kafka` (ports 9092, 29092)

**Services:**
8. `user-service` (port 3001)
9. `product-service` (port 3002)
10. `order-service` (port 3003)
11. `analytics-service` (port 3004)

### Step 4: Build Images
```bash
# Build all images
docker-compose build

# Or build specific service
docker-compose build user-service
```

### Step 5: Start Services
```bash
# Start all services (foreground)
docker-compose up

# Start all services (background)
docker-compose up -d

# Start specific service
docker-compose up user-service

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f order-service
```

### Step 6: Initialize Data (Optional)

The databases initialize automatically, but you can seed data:
```bash
# Create sample products
curl -X POST http://localhost:3002/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Product",
    "description": "A sample product",
    "price": 99.99,
    "category_name": "Electronics",
    "inventory_count": 100,
    "sku": "SAMPLE-001"
  }'
```

---

## Testing the Platform

### Test 1: Health Checks
```bash
# All services should return 200 OK
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

**Expected:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "service": "user-service",
    "status": "UP",
    "database": "connected",
    "cache": "connected"
  }
}
```

### Test 2: User Registration & Login
```bash
# Register a user
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Save the token from response

# Login
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### Test 3: Create Products
```bash
# Create Product 1
curl -X POST http://localhost:3002/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "Latest Apple smartphone",
    "price": 999.99,
    "category_name": "Electronics",
    "inventory_count": 50,
    "sku": "IPHONE-15-PRO"
  }'

# Create Product 2
curl -X POST http://localhost:3002/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 29.99,
    "category_name": "Electronics",
    "inventory_count": 100,
    "sku": "MOUSE-WL-001"
  }'

# Get all products
curl http://localhost:3002/api/products
```

### Test 4: Create Orders
```bash
# Replace TOKEN, USER_ID, and PRODUCT_IDs with actual values

curl -X POST http://localhost:3003/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "items": [
      {
        "product_id": "PRODUCT_ID_1",
        "quantity": 2
      },
      {
        "product_id": "PRODUCT_ID_2",
        "quantity": 1
      }
    ],
    "shipping_address": "123 Main St, San Francisco, CA 94105"
  }'
```

**Check Kafka Event Processing:**
```bash
# View Analytics Service logs
docker logs analytics-service | tail -20

# Look for:
# "INFO: Order event inserted"
# "INFO: Order items inserted"
```

### Test 5: View Analytics
```bash
# Dashboard metrics
curl http://localhost:3004/api/analytics/dashboard

# Daily sales
curl "http://localhost:3004/api/analytics/sales/daily?days=7"

# Top products
curl "http://localhost:3004/api/analytics/products/top-selling?limit=10"

# User activity
curl "http://localhost:3004/api/analytics/users/activity?days=30"
```

---

## Troubleshooting

### Issue 1: Port Already in Use

**Error:** `Bind for 0.0.0.0:3001 failed: port is already allocated`

**Solution:**
```bash
# Find process using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Issue 2: Container Won't Start

**Symptoms:** Container keeps restarting

**Solution:**
```bash
# View logs
docker logs <container-name>

# Common issues:
# 1. Database not ready → Wait longer (add healthcheck delays)
# 2. Missing environment variables → Check .env files
# 3. Port conflicts → Change ports in docker-compose.yml
```

### Issue 3: Kafka Consumer Not Processing Events

**Symptoms:** Orders created but analytics shows 0

**Solution:**
```bash
# Restart analytics service
docker-compose restart analytics-service

# Check Kafka topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Check consumer logs
docker logs analytics-service | grep "Kafka"
```

### Issue 4: Database Connection Errors

**Symptoms:** Service can't connect to database

**Solution:**
```bash
# Check database is running
docker ps | grep postgres

# Check database logs
docker logs user-postgres

# Restart database
docker-compose restart user-postgres

# If persistent, remove volumes and restart
docker-compose down -v
docker-compose up --build
```

### Issue 5: Out of Memory

**Symptoms:** Docker containers killed, system slow

**Solution:**
```bash
# Increase Docker memory in Docker Desktop settings
# Recommended: 8GB minimum, 16GB ideal

# Reduce number of containers
docker-compose up user-service product-service order-service
```

### Issue 6: Slow Performance

**Solution:**
```bash
# Prune unused containers/images
docker system prune -a

# Restart Docker Desktop

# Check resource usage
docker stats
```

---

## Development Workflow

### Local Development (Without Docker)

**Prerequisites:** Node.js 20+, Python 3.11+, PostgreSQL, Redis, Kafka

#### User Service
```bash
cd services/user-service

# Install dependencies
npm install

# Update .env with local database
PORT=3001
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost

# Run in development mode
npm run dev

# Run tests
npm test
```

#### Analytics Service
```bash
cd services/analytics-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Update .env with local services

# Run consumer
python consumer.py

# In another terminal, run API server
uvicorn src.main:app --reload --port 3004
```

### Code Changes
```bash
# Make changes to code

# For Node.js services (auto-reload with nodemon)
# Just save files, nodemon will restart

# For Python service
# Restart manually or use uvicorn --reload

# For Docker services
docker-compose up --build <service-name>
```

### Database Migrations
```bash
# Connect to database
docker exec -it user-postgres psql -U postgres -d userdb

# Run SQL commands
# CREATE TABLE ...
# ALTER TABLE ...
```

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service

# Last 100 lines
docker-compose logs --tail=100 analytics-service

# Follow logs in real-time
docker logs -f analytics-service
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears databases)
docker-compose down -v

# Stop specific service
docker-compose stop user-service

# Remove specific container
docker rm -f user-service
```

---

## Production Deployment

### Option 1: AWS

**Services Needed:**
- EKS (Kubernetes)
- RDS PostgreSQL (3 instances)
- ElastiCache Redis
- MSK (Managed Kafka)
- ECR (Container Registry)

**Steps:**
```bash
# 1. Build and push images
docker build -t your-registry/user-service:latest services/user-service
docker push your-registry/user-service:latest

# 2. Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/

# 3. Configure external access
kubectl apply -f infrastructure/kubernetes/ingress.yml
```

### Option 2: Google Cloud Platform

**Services Needed:**
- GKE (Kubernetes)
- Cloud SQL PostgreSQL
- Memorystore Redis
- Pub/Sub (or self-managed Kafka on GKE)

### Option 3: Digital Ocean / Linode

**For cost-effective deployment:**
- Kubernetes cluster
- Managed databases
- Self-managed Kafka on cluster

### Environment Variables (Production)

**Never commit secrets!** Use:
- Kubernetes Secrets
- AWS Secrets Manager
- HashiCorp Vault
- Environment variable injection

### Monitoring (Production)

Deploy monitoring stack:
```bash
# Prometheus
kubectl apply -f monitoring/prometheus/

# Grafana
kubectl apply -f monitoring/grafana/

# Jaeger
kubectl apply -f monitoring/jaeger/
```

---

## Useful Commands

### Docker Compose
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose build user-service

# Scale service
docker-compose up --scale order-service=3

# Execute command in container
docker-compose exec user-service npm test

# Remove all containers and volumes
docker-compose down -v
```

### Docker
```bash
# List containers
docker ps

# View logs
docker logs <container-name>

# Execute command
docker exec -it <container-name> bash

# Remove container
docker rm -f <container-name>

# Remove image
docker rmi <image-name>

# Clean up
docker system prune -a

# View resource usage
docker stats
```

### Database Access
```bash
# PostgreSQL (User Service)
docker exec -it user-postgres psql -U postgres -d userdb

# ClickHouse
docker exec -it clickhouse clickhouse-client

# Redis
docker exec -it shared-redis redis-cli
```

---

## Next Steps

1. ✅ **Explore the API** - Use Postman or curl to test endpoints
2. ✅ **Create Sample Data** - Add users, products, and orders
3. ✅ **View Analytics** - Check real-time metrics
4. ✅ **Read the Code** - Understand the implementation
5. ✅ **Make Changes** - Customize and extend features
6. ✅ **Deploy** - Try deploying to cloud platform

---

## Additional Resources

- [API Documentation](API_DOCUMENTATION.md)
- [Architecture Guide](ARCHITECTURE.md)
- [Main README](../README.md)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

## Getting Help

**Issues?** 
- Check [Troubleshooting](#troubleshooting) section
- Review logs: `docker-compose logs -f`
- Check GitHub Issues (if public repo)

**Questions?**
- Read the documentation thoroughly
- Check service health endpoints
- Verify environment variables

---


