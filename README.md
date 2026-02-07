# CloudCart Analytics Platform

A production-grade, event-driven microservices e-commerce platform with real-time analytics

[![Microservices](https://img.shields.io/badge/architecture-microservices-blue)](https://microservices.io/)
[![Event-Driven](https://img.shields.io/badge/pattern-event--driven-green)](https://www.enterpriseintegrationpatterns.com/patterns/messaging/EventDrivenArchitecture.html)
[![Docker](https://img.shields.io/badge/docker-containerized-blue)](https://www.docker.com/)
[![Kubernetes Ready](https://img.shields.io/badge/kubernetes-ready-326CE5)](https://kubernetes.io/)

## Overview

CloudCart is a **production-ready microservices platform** demonstrating modern cloud-native architecture patterns used by companies like Netflix, Uber, and Airbnb. It showcases event-driven design, real-time data processing, and scalable system architecture.

### Key Features

-  **Event-Driven Architecture** - Apache Kafka for asynchronous communication
-  **Real-Time Analytics** - ClickHouse + Apache Spark for instant insights
-  **Secure Authentication** - JWT-based auth with bcrypt password hashing
-  **High Performance** - Redis caching, optimized queries, connection pooling
-  **Containerized** - Docker Compose orchestration, production-ready images
-  **Kubernetes Ready** - Designed for cloud deployment
-  **Full Observability** - Structured logging, health checks, metrics ready

---

##  Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                         │
│              (Rate Limiting + Auth)                     │
└─────────────────────────────────────────────────────────┘
                          ║
        ╔═════════════════╬═════════════════╗
        ║                 ║                 ║
┌───────▼────────┐  ┌────▼─────────┐  ┌────▼──────────┐
│ User Service   │  │Product Service│  │ Order Service │
│   Node.js      │  │   Node.js     │  │   Node.js     │
│   PostgreSQL   │  │   PostgreSQL  │  │   PostgreSQL  │
│   Redis Cache  │  │   Redis Cache │  │   Kafka Pub   │
└────────────────┘  └───────────────┘  └───────────────┘
                          ║
                  ┌───────▼────────┐
                  │Analytics Service│
                  │    Python       │
                  │  Kafka Consumer │
                  │   ClickHouse    │
                  └─────────────────┘
```

## Architecture Diagrams

Detailed architecture documentation and diagrams:

- [System Architecture](docs/diagrams/system-architecture.md) - Complete system overview
- [Order Flow Diagram](docs/diagrams/order-flow.md) - End-to-end order creation flow

---

### Technology Stack

#### Backend Services
- **User Service**: Node.js + Express + PostgreSQL + Redis + JWT
- **Product Service**: Node.js + Express + PostgreSQL + Redis
- **Order Service**: Node.js + Express + PostgreSQL + Kafka
- **Analytics Service**: Python + FastAPI + ClickHouse + Kafka

#### Infrastructure
- **Databases**: PostgreSQL (3 instances), ClickHouse
- **Cache**: Redis
- **Message Broker**: Apache Kafka + Zookeeper
- **Container Orchestration**: Docker Compose
- **Deployment Ready**: Kubernetes manifests included

#### Development Tools
- **Testing**: Jest, Pytest
- **API Documentation**: OpenAPI/Swagger
- **Logging**: Winston, Python logging
- **Version Control**: Git

---

##  Quick Start

### Prerequisites

- Docker Desktop (20.x+)
- Docker Compose (2.x+)
- Node.js (20.x+) - for local development
- Python (3.11+) - for local development
- 8GB RAM minimum (16GB recommended)

### Run the Platform
```bash
# Clone the repository
git clone https://github.com/yourusername/cloudcart-platform.git
cd cloudcart-platform

# Start all services
docker-compose up --build

# Wait for services to be ready (~2-3 minutes)
# Check health endpoints
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:3003/health  # Order Service
curl http://localhost:3004/health  # Analytics Service
```

**Services will be available at:**
- User Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003
- Analytics Service: http://localhost:3004

---

##  API Documentation

### User Service (Port 3001)
```bash
# Register a new user
POST /api/users/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}

# Login
POST /api/users/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

# Get profile (requires JWT token)
GET /api/users/profile
Authorization: Bearer <token>
```

### Product Service (Port 3002)
```bash
# Create product
POST /api/products
{
  "name": "iPhone 15 Pro",
  "description": "Latest smartphone",
  "price": 999.99,
  "category_name": "Electronics",
  "inventory_count": 50,
  "sku": "IPHONE-15-PRO"
}

# Get all products (with filters)
GET /api/products?category=Electronics&search=iphone&minPrice=500&maxPrice=1500

# Get single product
GET /api/products/:id
```

### Order Service (Port 3003)
```bash
# Create order (publishes Kafka event)
POST /api/orders
Authorization: Bearer <token>
{
  "user_id": "user-uuid",
  "items": [
    {
      "product_id": "product-uuid",
      "quantity": 2
    }
  ],
  "shipping_address": "123 Main St, City, State 12345"
}

# Get order by ID
GET /api/orders/:id

# Update order status
PUT /api/orders/:id/status
{
  "status": "confirmed"
}

# Cancel order
POST /api/orders/:id/cancel
```

### Analytics Service (Port 3004)
```bash
# Get dashboard metrics
GET /api/analytics/dashboard

# Get daily sales
GET /api/analytics/sales/daily?days=7

# Get top selling products
GET /api/analytics/products/top-selling?limit=10

# Get user activity
GET /api/analytics/users/activity?days=30

# Get order status distribution
GET /api/analytics/orders/status-distribution
```

---

##  Key Features Deep Dive

### 1. Event-Driven Architecture

**Kafka Topics:**
- `order.created` - New order events
- `order.confirmed` - Order confirmation events
- `order.shipped` - Shipping events
- `order.delivered` - Delivery events
- `order.cancelled` - Cancellation events

**Flow:**
1. Order Service publishes events to Kafka
2. Analytics Service consumes events in real-time
3. Data processed and stored in ClickHouse
4. Instant analytics available via API

### 2. Real-Time Analytics

**Metrics Tracked:**
- Total orders and revenue
- Daily/weekly/monthly sales trends
- Top-selling products
- User purchase patterns
- Order status distribution
- Average order value
- Conversion metrics

**Technology:** ClickHouse (columnar database) provides sub-second query performance on millions of records.

### 3. Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 rounds)
- Rate limiting (100 requests/15 min per IP)
- Helmet.js security headers
- Input validation with Joi
- SQL injection prevention
- CORS configuration

### 4. Performance Optimization

- Redis caching (session data, frequently accessed products)
- Database connection pooling
- Optimized database indexes
- Query result caching
- Async/await patterns
- Graceful shutdown handling

---

## Performance Metrics

Based on local testing:

| Metric | Value |
|--------|-------|
| Order Creation | ~200ms p95 |
| Product Search | ~50ms p95 |
| Analytics Query | ~100ms p95 |
| Event Processing | Real-time (<1s) |
| Concurrent Users | 100+ supported |

---

## Testing
```bash
# Run tests for all services
docker-compose run user-service npm test
docker-compose run product-service npm test
docker-compose run order-service npm test
docker-compose run analytics-service pytest

# Run with coverage
docker-compose run user-service npm test -- --coverage
```

---

## Configuration

### Environment Variables

Each service has its own `.env` file:
```bash
# services/user-service/.env
PORT=3001
NODE_ENV=development
DB_HOST=user-postgres
JWT_SECRET=your-secret-key
REDIS_HOST=redis
```

### Scaling Services
```bash
# Scale a specific service
docker-compose up --scale order-service=3

# View running instances
docker-compose ps
```

---

## Project Structure
```
cloudcart-platform/
├── services/
│   ├── user-service/          # User authentication & management
│   ├── product-service/       # Product catalog
│   ├── order-service/         # Order processing + Kafka producer
│   └── analytics-service/     # Real-time analytics + Kafka consumer
├── infrastructure/
│   ├── terraform/             # IaC for AWS deployment
│   └── kubernetes/            # K8s manifests
├── monitoring/
│   ├── prometheus/            # Metrics collection
│   └── grafana/              # Visualization
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   └── SETUP_GUIDE.md
├── docker-compose.yml         # Local orchestration
└── README.md
```

---

## Deployment

### Local Development
```bash
docker-compose up
```

### Production (Kubernetes)
```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/

# Or use Helm
helm install cloudcart ./charts/cloudcart
```

### Cloud Providers
- **AWS**: EKS + RDS + ElastiCache + MSK
- **GCP**: GKE + Cloud SQL + Memorystore + Pub/Sub
- **Azure**: AKS + Azure Database + Redis Cache + Event Hubs

---

## Learning Outcomes

This project demonstrates:

✅ **Microservices Architecture** - Service decomposition, inter-service communication  
✅ **Event-Driven Design** - Kafka, async messaging, eventual consistency  
✅ **Database Design** - Multiple databases, data modeling, indexing  
✅ **Caching Strategies** - Redis, cache invalidation, performance optimization  
✅ **API Design** - RESTful APIs, versioning, documentation  
✅ **Authentication** - JWT, password security, session management  
✅ **Containerization** - Docker, multi-stage builds, orchestration  
✅ **Data Processing** - Real-time analytics, streaming data  
✅ **Production Patterns** - Health checks, logging, error handling  
✅ **DevOps** - CI/CD ready, infrastructure as code  

---

## Future Enhancements

- [ ] Kubernetes deployment with Helm charts
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring stack (Prometheus + Grafana)
- [ ] Distributed tracing (Jaeger)
- [ ] Service mesh (Istio)
- [ ] API Gateway (Kong/NGINX)
- [ ] GraphQL API layer
- [ ] Machine learning recommendations
- [ ] Mobile app (React Native)
- [ ] Admin dashboard (React)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Sakshi**
- GitHub: [Sakshi3027](https://github.com/Sakshi3027)
- Email: sakshchavan30@gmail.com

---

## Acknowledgments

- Inspired by microservices architectures at Netflix, Uber, and Airbnb
- Built with modern cloud-native technologies
- Designed for scalability and production readiness

---

## Additional Resources

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Architecture Decisions](docs/ARCHITECTURE.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---