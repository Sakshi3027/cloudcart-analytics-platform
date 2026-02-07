# System Architecture

## High-Level Architecture
```
                          ┌─────────────────┐
                          │   Web Client    │
                          │  (React App)    │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  API Gateway    │
                          │ (Future: Kong)  │
                          └────────┬────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼─────────┐    ┌───────▼─────────┐    ┌───────▼──────────┐
│  User Service   │    │ Product Service │    │  Order Service   │
│  (Node.js)      │    │   (Node.js)     │    │   (Node.js)      │
│                 │    │                 │    │                  │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌──────────────┐ │
│ │ PostgreSQL  │ │    │ │ PostgreSQL  │ │    │ │ PostgreSQL   │ │
│ │   (5432)    │ │    │ │   (5433)    │ │    │ │   (5434)     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └──────────────┘ │
│                 │    │                 │    │                  │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌──────────────┐ │
│ │    Redis    │◄┼────┼─┤    Redis    │◄┼────┼─┤    Redis     │ │
│ │ (Shared)    │ │    │ │ (Shared)    │ │    │ │  (Shared)    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └──────────────┘ │
└─────────────────┘    └─────────────────┘    │                  │
                                               │ ┌──────────────┐ │
                                               │ │    Kafka     │ │
                                               │ │  (Producer)  │ │
                                               │ └──────┬───────┘ │
                                               └────────┼─────────┘
                                                        │
                                               ┌────────▼─────────┐
                                               │   Kafka Broker   │
                                               │   (Zookeeper)    │
                                               └────────┬─────────┘
                                                        │
                                               ┌────────▼─────────┐
                                               │Analytics Service │
                                               │    (Python)      │
                                               │                  │
                                               │ ┌──────────────┐ │
                                               │ │  ClickHouse  │ │
                                               │ │  (Analytics) │ │
                                               │ └──────────────┘ │
                                               │                  │
                                               │ ┌──────────────┐ │
                                               │ │    Kafka     │ │
                                               │ │  (Consumer)  │ │
                                               │ └──────────────┘ │
                                               └──────────────────┘
```

## Component Details

### Frontend Layer
- **React Dashboard**: Real-time analytics visualization
- **REST API Client**: Axios for API calls
- **WebSocket Client**: Live updates (future)

### API Gateway (Future)
- **Kong/NGINX**: Load balancing, rate limiting
- **Authentication**: JWT validation
- **Request Routing**: Service discovery

### Microservices Layer

#### User Service (Port 3001)
- **Purpose**: Authentication & user management
- **Database**: PostgreSQL (userdb)
- **Cache**: Redis (sessions, profiles)
- **APIs**: Register, Login, Profile management

#### Product Service (Port 3002)
- **Purpose**: Product catalog management
- **Database**: PostgreSQL (productdb)
- **Cache**: Redis (product details, categories)
- **APIs**: CRUD operations, search, filtering

#### Order Service (Port 3003)
- **Purpose**: Order processing & orchestration
- **Database**: PostgreSQL (orderdb)
- **Cache**: Redis (order details)
- **Event Publishing**: Kafka producer
- **APIs**: Create order, status updates, cancellation

#### Analytics Service (Port 3004)
- **Purpose**: Real-time analytics & reporting
- **Database**: ClickHouse (OLAP)
- **Event Processing**: Kafka consumer
- **APIs**: Dashboard metrics, reports, insights

### Data Layer

#### PostgreSQL (3 instances)
- **User DB**: User accounts, authentication
- **Product DB**: Products, categories, inventory
- **Order DB**: Orders, order items, order events

#### ClickHouse
- **Order Events**: Real-time event storage
- **Analytics Tables**: Aggregated metrics
- **Optimized**: Columnar storage for fast queries

#### Redis
- **Session Store**: JWT token blacklist
- **Cache Layer**: User profiles, products
- **TTL**: Auto-expiration (1 hour default)

### Messaging Layer

#### Apache Kafka
- **Topics**: order.created, order.confirmed, order.shipped, etc.
- **Producer**: Order Service
- **Consumer**: Analytics Service
- **Zookeeper**: Kafka coordination
