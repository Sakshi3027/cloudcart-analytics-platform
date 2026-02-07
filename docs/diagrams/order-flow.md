# Order Creation Flow

## Sequence Diagram
```
Client          User Service    Order Service   Product Service   Kafka    Analytics Service   ClickHouse
  │                  │                │                 │            │             │               │
  │─────Register────>│                │                 │            │             │               │
  │                  │                │                 │            │             │               │
  │<─────Token───────│                │                 │            │             │               │
  │                  │                │                 │            │             │               │
  │────────────────Create Order──────>│                 │            │             │               │
  │                  │                │                 │            │             │               │
  │                  │<──Validate User│                 │            │             │               │
  │                  │                │                 │            │             │               │
  │                  │────User OK────>│                 │            │             │               │
  │                  │                │                 │            │             │               │
  │                  │                │───Get Product──>│            │             │               │
  │                  │                │                 │            │             │               │
  │                  │                │<──Product Info──│            │             │               │
  │                  │                │                 │            │             │               │
  │                  │                │──Check Inventory│            │             │               │
  │                  │                │                 │            │             │               │
  │                  │                │<──Stock OK──────│            │             │               │
  │                  │                │                 │            │             │               │
  │                  │                │────Save Order───>            │             │               │
  │                  │                │   (PostgreSQL)               │             │               │
  │                  │                │                 │            │             │               │
  │                  │                │──Publish Event──────────────>│             │               │
  │                  │                │  (order.created)│            │             │               │
  │                  │                │                 │            │             │               │
  │<────Order Created (200)───────────│                 │            │             │               │
  │                  │                │                 │            │────Consume─>│               │
  │                  │                │                 │            │   Event     │               │
  │                  │                │                 │            │             │               │
  │                  │                │                 │            │             │──Store Event─>│
  │                  │                │                 │            │             │               │
  │                  │                │                 │            │             │──Store Items─>│
  │                  │                │                 │            │             │               │
  │───────Get Analytics──────────────────────────────────────────────────────────>│               │
  │                  │                │                 │            │             │               │
  │                  │                │                 │            │             │<──Query Data──│
  │                  │                │                 │            │             │               │
  │<────────────Dashboard Metrics─────────────────────────────────────────────────│               │
```

## Timeline

1. **0ms**: Client sends create order request with JWT token
2. **50ms**: Order Service validates token with User Service
3. **100ms**: Order Service fetches product details from Product Service
4. **120ms**: Inventory check passes
5. **150ms**: Order saved to PostgreSQL
6. **180ms**: Kafka event published (async - doesn't block response)
7. **200ms**: Client receives order confirmation
8. **500ms**: Analytics Service processes event (async)
9. **600ms**: Data stored in ClickHouse
10. **Real-time**: Dashboard updates with new metrics