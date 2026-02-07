# Architecture & Design Decisions

## Table of Contents

- [System Architecture](#system-architecture)
- [Design Principles](#design-principles)
- [Architecture Patterns](#architecture-patterns)
- [Technology Choices](#technology-choices)
- [Data Flow](#data-flow)
- [Scalability Considerations](#scalability-considerations)
- [Security Architecture](#security-architecture)
- [Trade-offs & Decisions](#trade-offs--decisions)

---

## System Architecture

### High-Level Overview

CloudCart uses a **microservices architecture** with **event-driven communication** to achieve loose coupling, independent scalability, and fault isolation.
```
┌──────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                   (Web/Mobile/API Clients)                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│           (Rate Limiting, Authentication, Routing)           │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│     User     │      │   Product    │      │    Order     │
│   Service    │      │   Service    │      │   Service    │
│              │      │              │      │              │
│  PostgreSQL  │      │  PostgreSQL  │      │  PostgreSQL  │
│    Redis     │      │    Redis     │      │    Kafka     │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    │ Events
                                                    ▼
                                            ┌──────────────┐
                                            │  Analytics   │
                                            │   Service    │
                                            │              │
                                            │  ClickHouse  │
                                            │    Kafka     │
                                            └──────────────┘
```

---

## Design Principles

### 1. Separation of Concerns

Each microservice has a **single, well-defined responsibility**:

- **User Service**: Authentication, user management
- **Product Service**: Catalog management, inventory
- **Order Service**: Order processing, transaction orchestration
- **Analytics Service**: Data aggregation, real-time metrics

### 2. Database Per Service

Each service owns its database to ensure:
- ✅ **Independence**: Services can be deployed independently
- ✅ **Scalability**: Databases scaled per service needs
- ✅ **Technology Freedom**: Best database for each use case
- ✅ **Failure Isolation**: Database failures don't cascade

**Trade-off**: Distributed transactions require event-driven patterns (Saga pattern).

### 3. API-First Design

All services expose well-defined REST APIs:
- Consistent response formats
- Proper HTTP status codes
- Comprehensive error handling
- OpenAPI/Swagger documentation ready

### 4. Event-Driven Communication

**Synchronous** (REST) for:
- Read operations
- Immediate consistency requirements
- Direct service-to-service calls (Order → Product, Order → User)

**Asynchronous** (Kafka) for:
- Write operations that trigger side effects
- Analytics and reporting
- Loose coupling between services
- Event sourcing patterns

---

## Architecture Patterns

### 1. Microservices Pattern

**Why Microservices?**
- Independent deployment and scaling
- Technology diversity (Node.js + Python)
- Team autonomy
- Fault isolation

**Implementation:**
- 4 independent services
- Separate databases
- Docker containerization
- RESTful APIs

### 2. Event-Driven Architecture (EDA)

**Why Event-Driven?**
- Loose coupling between services
- Asynchronous processing
- Real-time data pipeline
- Scalability

**Implementation:**
- Apache Kafka as message broker
- Order Service publishes events
- Analytics Service consumes events
- Multiple topics for different event types

**Events:**
```
order.created → Analytics Service
order.confirmed → Analytics Service, Notification Service (future)
order.shipped → Analytics Service, Tracking Service (future)
order.delivered → Analytics Service
order.cancelled → Analytics Service, Inventory Service (future)
```

### 3. CQRS (Command Query Responsibility Segregation)

**Separation of Reads and Writes:**

**Command Side** (Order Service):
- Handles write operations
- Publishes events
- PostgreSQL for transactional data

**Query Side** (Analytics Service):
- Handles read operations
- Consumes events
- ClickHouse for analytical queries

**Benefits:**
- Optimized for different workloads
- Independent scaling
- Better performance

### 4. Cache-Aside Pattern

**Implementation:**
- Redis as distributed cache
- Cache frequently accessed data (user profiles, popular products)
- Explicit cache invalidation on updates

**Flow:**
```
1. Check cache → Hit: Return cached data
2. Cache miss → Fetch from database
3. Store in cache → Return data
4. On update → Invalidate cache
```

### 5. API Gateway Pattern

**Current**: Direct service access  
**Production Ready**: NGINX/Kong API Gateway

**Benefits:**
- Single entry point
- Request routing
- Load balancing
- Rate limiting
- Authentication
- Request/response transformation

---

## Technology Choices

### Why Node.js for User/Product/Order Services?

✅ **Async I/O**: Perfect for I/O-bound operations (DB queries, API calls)  
✅ **Performance**: Event loop handles concurrent requests efficiently  
✅ **Ecosystem**: Rich npm ecosystem (Express, JWT, bcrypt)  
✅ **JSON Native**: Natural fit for REST APIs  
✅ **Team Familiarity**: Large developer community  

### Why Python for Analytics Service?

✅ **Data Processing**: Excellent libraries (Pandas, NumPy)  
✅ **Kafka Integration**: kafka-python, confluent-kafka  
✅ **ClickHouse Driver**: Native Python support  
✅ **FastAPI**: Modern, fast web framework  
✅ **Type Hints**: Better code quality  

### Why PostgreSQL?

✅ **ACID Compliance**: Critical for transactional data (orders, payments)  
✅ **Reliability**: Battle-tested, production-proven  
✅ **JSON Support**: Flexible schema where needed  
✅ **Performance**: Excellent query optimization  
✅ **Extensions**: uuid-ossp, full-text search  

### Why ClickHouse for Analytics?

✅ **Columnar Storage**: Optimized for analytical queries  
✅ **High Performance**: 100x faster than traditional RDBMS for analytics  
✅ **Compression**: Efficient storage  
✅ **Real-time**: Insert and query simultaneously  
✅ **SQL Interface**: Familiar query language  

### Why Redis?

✅ **Speed**: In-memory, sub-millisecond latency  
✅ **Data Structures**: Lists, sets, sorted sets, hashes  
✅ **TTL**: Built-in expiration  
✅ **Pub/Sub**: Real-time messaging  
✅ **Persistence**: Optional durability  

### Why Apache Kafka?

✅ **High Throughput**: Millions of messages/second  
✅ **Durability**: Persistent message storage  
✅ **Scalability**: Horizontal scaling  
✅ **Fault Tolerance**: Replication  
✅ **Stream Processing**: Real-time data pipelines  

### Why Docker Compose?

✅ **Local Development**: Easy multi-container setup  
✅ **Consistency**: Same environment across team  
✅ **Resource Efficiency**: Lightweight containers  
✅ **Orchestration**: Service dependencies  
✅ **Production Ready**: Kubernetes manifests use same images  

---

## Data Flow

### Order Creation Flow
```
1. Client → POST /api/orders (User Service validates token)
              ↓
2. Order Service validates request
              ↓
3. Order Service → GET /api/users/profile (verify user exists)
              ↓
4. Order Service → GET /api/products/:id (verify products, check inventory)
              ↓
5. Order Service creates order in PostgreSQL
              ↓
6. Order Service publishes "order.created" event to Kafka
              ↓
7. Analytics Service consumes event
              ↓
8. Analytics Service stores data in ClickHouse
              ↓
9. Real-time analytics updated
```

**Latency:**
- Order creation: ~200ms p95
- Event processing: <1s
- Analytics update: Real-time

---

## Scalability Considerations

### Horizontal Scaling

**Services:**
```bash
# Scale Order Service to 3 instances
docker-compose up --scale order-service=3

# Load balancer distributes requests
```

**Databases:**
- PostgreSQL: Read replicas for read-heavy services
- Redis: Redis Cluster for distributed caching
- ClickHouse: Distributed tables, sharding
- Kafka: Multiple brokers, partitions

### Vertical Scaling

**Current Setup:**
- Services: 100m CPU, 128Mi RAM (requests)
- Databases: Configured for local development

**Production:**
- Services: 500m-2 CPU, 512Mi-2Gi RAM
- Databases: Dedicated instances with appropriate sizing

### Caching Strategy

**Levels:**
1. **Application Cache** (Redis): User sessions, product details
2. **Query Cache**: Database query results
3. **CDN** (future): Static assets, images

**Invalidation:**
- Time-based (TTL)
- Event-based (on updates)
- Manual (admin tools)

### Database Optimization

**Indexes:**
```sql
-- User Service
CREATE INDEX idx_users_email ON users(email);

-- Product Service
CREATE INDEX idx_products_category ON products(category_name);
CREATE INDEX idx_products_name ON products(name);

-- Order Service
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

**Connection Pooling:**
- Max connections: 20 per service
- Idle timeout: 30s
- Connection timeout: 2s

---

## Security Architecture

### 1. Authentication & Authorization

**JWT (JSON Web Tokens):**
```javascript
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234654290  // 24-hour expiration
}
```

**Password Security:**
- bcrypt hashing (10 rounds)
- Salted hashes
- No plaintext storage

### 2. API Security

**Rate Limiting:**
- 100 requests per 15 minutes per IP
- Prevents brute force attacks
- DDoS mitigation

**Input Validation:**
- Joi schemas for all inputs
- SQL injection prevention
- XSS protection

**Headers (Helmet.js):**
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### 3. Network Security

**Container Network:**
- Isolated Docker network
- Services communicate internally
- Only necessary ports exposed

**Database Security:**
- Not exposed to public internet
- Service-to-service communication only
- Encrypted connections (production)

### 4. Secrets Management

**Development:**
- .env files (gitignored)
- Environment variables

**Production:**
- HashiCorp Vault
- AWS Secrets Manager
- Kubernetes Secrets

---

## Trade-offs & Decisions

### 1. Eventual Consistency vs Strong Consistency

**Decision**: Eventual consistency for analytics

**Reasoning:**
- Analytics don't require real-time accuracy
- Allows for better scalability
- Reduces coupling between services

**Trade-off**: Slight delay (< 1s) in analytics updates

---

### 2. Microservices vs Monolith

**Decision**: Microservices

**Reasoning:**
- Demonstrates modern architecture
- Independent scaling
- Technology diversity
- Portfolio showcase

**Trade-off**: Increased complexity, distributed transactions

---

### 3. Synchronous vs Asynchronous Communication

**Decision**: Hybrid approach

**Synchronous (REST):**
- Order → User validation
- Order → Product validation
- Immediate feedback required

**Asynchronous (Kafka):**
- Order → Analytics
- Future: Notifications, emails
- No immediate response needed

**Trade-off**: More complex than pure REST or pure events

---

### 4. Single vs Multiple Databases

**Decision**: Database per service

**Reasoning:**
- Service independence
- Failure isolation
- Optimal database per use case

**Trade-off**: No ACID transactions across services (use Saga pattern)

---

### 5. Docker Compose vs Kubernetes (Local Dev)

**Decision**: Docker Compose for local development

**Reasoning:**
- Simpler setup
- Faster iteration
- Lower resource requirements
- Same images used in Kubernetes

**Trade-off**: Not production orchestration (solved by Kubernetes manifests)

---

## Future Architecture Enhancements

### 1. Service Mesh (Istio/Linkerd)

**Benefits:**
- Automatic mTLS between services
- Traffic management (canary deployments)
- Circuit breaking
- Distributed tracing

### 2. API Gateway (Kong/NGINX)

**Benefits:**
- Single entry point
- Request routing
- Authentication
- Rate limiting
- Request transformation

### 3. Monitoring Stack

**Components:**
- Prometheus: Metrics collection
- Grafana: Visualization
- Jaeger: Distributed tracing
- ELK/Loki: Log aggregation

### 4. Message Queue (RabbitMQ/SQS)

**For:**
- Email notifications
- Background jobs
- Task scheduling

### 5. CDN Integration

**For:**
- Static assets
- Product images
- API caching

---

## Lessons Learned

### What Worked Well

✅ Event-driven architecture for analytics  
✅ Separate databases per service  
✅ Docker containerization  
✅ Structured logging  
✅ Health checks  

### What Could Be Improved

🔧 Add API Gateway for single entry point  
🔧 Implement distributed tracing  
🔧 Add comprehensive monitoring  
🔧 Implement circuit breakers  
🔧 Add automated testing in CI/CD  

---

## References

- [Microservices Pattern](https://microservices.io/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [12-Factor App](https://12factor.net/)

---

**For more details, see the [API Documentation](API_DOCUMENTATION.md) and [Setup Guide](SETUP_GUIDE.md)**
