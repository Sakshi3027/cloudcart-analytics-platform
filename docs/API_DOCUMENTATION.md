# API Documentation

Complete API reference for CloudCart Analytics Platform

## Table of Contents

- [Authentication](#authentication)
- [User Service API](#user-service-api)
- [Product Service API](#product-service-api)
- [Order Service API](#order-service-api)
- [Analytics Service API](#analytics-service-api)
- [Error Responses](#error-responses)

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. Register or login to receive a JWT token
2. Token expires after 24 hours
3. Include token in all protected endpoint requests

---

## User Service API

**Base URL:** `http://localhost:3001`

### Register User

Create a new user account.

**Endpoint:** `POST /api/users/register`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "created_at": "2026-02-05T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/users/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Profile

Get current user's profile (protected).

**Endpoint:** `GET /api/users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "created_at": "2026-02-05T10:30:00.000Z",
      "updated_at": "2026-02-05T10:30:00.000Z"
    }
  }
}
```

---

### Update Profile

Update user profile information (protected).

**Endpoint:** `PUT /api/users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "first_name": "Johnny",
  "last_name": "Smith"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "first_name": "Johnny",
      "last_name": "Smith",
      "role": "user",
      "updated_at": "2026-02-05T11:00:00.000Z"
    }
  }
}
```

---

## Product Service API

**Base URL:** `http://localhost:3002`

### Create Product

Add a new product to the catalog.

**Endpoint:** `POST /api/products`

**Request Body:**
```json
{
  "name": "iPhone 15 Pro",
  "description": "Latest Apple smartphone with A17 Pro chip",
  "price": 999.99,
  "category_name": "Electronics",
  "inventory_count": 50,
  "image_url": "https://example.com/iphone15.jpg",
  "sku": "IPHONE-15-PRO"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "iPhone 15 Pro",
      "description": "Latest Apple smartphone with A17 Pro chip",
      "price": "999.99",
      "category_name": "Electronics",
      "inventory_count": 50,
      "image_url": "https://example.com/iphone15.jpg",
      "sku": "IPHONE-15-PRO",
      "is_active": true,
      "created_at": "2026-02-05T12:00:00.000Z"
    }
  }
}
```

---

### Get All Products

Retrieve products with optional filtering and pagination.

**Endpoint:** `GET /api/products`

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `category` (string): Filter by category name
- `search` (string): Search in name and description
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Field to sort by (name, price, created_at)
- `sortOrder` (string): ASC or DESC

**Example:** `GET /api/products?category=Electronics&search=iphone&minPrice=500&page=1&limit=10`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "iPhone 15 Pro",
        "description": "Latest Apple smartphone",
        "price": "999.99",
        "category_name": "Electronics",
        "inventory_count": 50,
        "sku": "IPHONE-15-PRO",
        "is_active": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

### Get Product by ID

Retrieve a single product by its ID.

**Endpoint:** `GET /api/products/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "iPhone 15 Pro",
      "description": "Latest Apple smartphone",
      "price": "999.99",
      "category_name": "Electronics",
      "inventory_count": 50
    }
  }
}
```

---

### Update Product

Update product information.

**Endpoint:** `PUT /api/products/:id`

**Request Body:**
```json
{
  "price": 899.99,
  "inventory_count": 75
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "iPhone 15 Pro",
      "price": "899.99",
      "inventory_count": 75,
      "updated_at": "2026-02-05T13:00:00.000Z"
    }
  }
}
```

---

### Delete Product

Soft delete a product (sets is_active to false).

**Endpoint:** `DELETE /api/products/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### Get Categories

Retrieve all product categories.

**Endpoint:** `GET /api/products/categories/all`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Electronics",
        "description": "Electronic devices and gadgets",
        "created_at": "2026-02-05T10:00:00.000Z"
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "Clothing",
        "description": "Apparel and fashion items",
        "created_at": "2026-02-05T10:00:00.000Z"
      }
    ]
  }
}
```

---

## Order Service API

**Base URL:** `http://localhost:3003`

### Create Order

Create a new order and publish event to Kafka.

**Endpoint:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "product_id": "660e8400-e29b-41d4-a716-446655440001",
      "quantity": 2
    },
    {
      "product_id": "770e8400-e29b-41d4-a716-446655440002",
      "quantity": 1
    }
  ],
  "shipping_address": "123 Main St, San Francisco, CA 94105"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "total_amount": "2029.97",
      "status": "pending",
      "payment_status": "pending",
      "shipping_address": "123 Main St, San Francisco, CA 94105",
      "created_at": "2026-02-05T14:00:00.000Z",
      "items": [
        {
          "product_id": "660e8400-e29b-41d4-a716-446655440001",
          "product_name": "iPhone 15 Pro",
          "quantity": 2,
          "price": "999.99",
          "subtotal": "1999.98"
        },
        {
          "product_id": "770e8400-e29b-41d4-a716-446655440002",
          "product_name": "Wireless Mouse",
          "quantity": 1,
          "price": "29.99",
          "subtotal": "29.99"
        }
      ]
    }
  }
}
```

**Kafka Event Published:** `order.created`

---

### Get Order by ID

Retrieve order details.

**Endpoint:** `GET /api/orders/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "total_amount": "2029.97",
      "status": "pending",
      "items": [...]
    }
  }
}
```

---

### Get Orders by User ID

Retrieve all orders for a specific user.

**Endpoint:** `GET /api/orders/user/:userId`

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### Update Order Status

Update the status of an order (publishes Kafka event).

**Endpoint:** `PUT /api/orders/:id/status`

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid statuses:** `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "status": "confirmed",
      "updated_at": "2026-02-05T15:00:00.000Z"
    }
  }
}
```

**Kafka Event Published:** `order.confirmed`

---

### Cancel Order

Cancel an order (only pending or confirmed orders).

**Endpoint:** `POST /api/orders/:id/cancel`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "status": "cancelled",
      "updated_at": "2026-02-05T15:30:00.000Z"
    }
  }
}
```

**Kafka Event Published:** `order.cancelled`

---

## Analytics Service API

**Base URL:** `http://localhost:3004`

### Get Dashboard Metrics

Retrieve comprehensive dashboard analytics.

**Endpoint:** `GET /api/analytics/dashboard`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_orders": 150,
      "total_revenue": 304495.50,
      "average_order_value": 2029.97
    },
    "recent_sales": [
      {
        "date": "2026-02-05",
        "total_orders": 25,
        "total_revenue": 50749.25
      },
      {
        "date": "2026-02-04",
        "total_orders": 30,
        "total_revenue": 60899.10
      }
    ],
    "top_products": [
      {
        "product_name": "iPhone 15 Pro",
        "total_quantity": 300,
        "total_revenue": 299997.00
      },
      {
        "product_name": "Wireless Mouse",
        "total_quantity": 150,
        "total_revenue": 4498.50
      }
    ],
    "order_status": [
      {
        "status": "delivered",
        "count": 80,
        "percentage": 53.33
      },
      {
        "status": "pending",
        "count": 40,
        "percentage": 26.67
      },
      {
        "status": "shipped",
        "count": 30,
        "percentage": 20.00
      }
    ],
    "last_updated": "2026-02-05T16:00:00.000Z"
  }
}
```

---

### Get Daily Sales

Retrieve daily sales metrics.

**Endpoint:** `GET /api/analytics/sales/daily`

**Query Parameters:**
- `days` (integer): Number of days (1-90, default: 7)

**Example:** `GET /api/analytics/sales/daily?days=7`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "daily_sales": [
      {
        "date": "2026-02-05",
        "total_orders": 25,
        "total_revenue": 50749.25,
        "average_order_value": 2029.97
      }
    ],
    "period_days": 7
  }
}
```

---

### Get Top Selling Products

Retrieve top-selling products by revenue.

**Endpoint:** `GET /api/analytics/products/top-selling`

**Query Parameters:**
- `limit` (integer): Number of products (1-100, default: 10)

**Example:** `GET /api/analytics/products/top-selling?limit=10`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "product_id": "660e8400-e29b-41d4-a716-446655440001",
        "product_name": "iPhone 15 Pro",
        "total_quantity": 300,
        "total_revenue": 299997.00,
        "order_count": 150
      }
    ],
    "limit": 10
  }
}
```

---

### Get User Activity

Retrieve top active users by spending.

**Endpoint:** `GET /api/analytics/users/activity`

**Query Parameters:**
- `days` (integer): Time period (1-365, default: 30)

**Example:** `GET /api/analytics/users/activity?days=30`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "top_users": [
      {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "order_count": 15,
        "total_spent": 30449.55,
        "last_order_date": "2026-02-05T14:00:00.000Z"
      }
    ],
    "period_days": 30
  }
}
```

---

### Get Order Status Distribution

Retrieve current distribution of order statuses.

**Endpoint:** `GET /api/analytics/orders/status-distribution`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "distribution": [
      {
        "status": "delivered",
        "count": 80,
        "percentage": 53.33
      },
      {
        "status": "pending",
        "count": 40,
        "percentage": 26.67
      }
    ],
    "total_orders": 150
  }
}
```

---

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

| Status Code | Meaning |
|------------|---------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Example Error Response
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP address
- **Headers:** Rate limit info in response headers
- **Exceeded:** Returns 429 status code

---

## Health Checks

All services expose health check endpoints:
```bash
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "service": "user-service",
    "status": "UP",
    "timestamp": "2026-02-05T16:00:00.000Z",
    "database": "connected",
    "cache": "connected"
  }
}
```

---

**For more information, see the [main README](../README.md)**
