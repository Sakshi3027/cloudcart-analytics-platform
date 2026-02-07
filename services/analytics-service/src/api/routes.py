from fastapi import APIRouter, HTTPException, Query
from src.models.analytics import AnalyticsResponse
from src.kafka_consumer.clickhouse_client import clickhouse_client
from src.utils.logger import logger
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test ClickHouse connection
        clickhouse_client.client.execute("SELECT 1")
        
        return {
            "success": True,
            "message": "Service is healthy",
            "data": {
                "service": "analytics-service",
                "status": "UP",
                "timestamp": datetime.utcnow().isoformat(),
                "clickhouse": "connected",
                "kafka": "connected"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service is unhealthy")

@router.get("/sales/daily")
async def get_daily_sales(days: int = Query(default=7, ge=1, le=90)):
    """Get daily sales metrics"""
    try:
        results = clickhouse_client.get_daily_sales(days)
        
        daily_sales = []
        for row in results:
            daily_sales.append({
                "date": str(row[0]),
                "total_orders": row[1],
                "total_revenue": float(row[2]) if row[2] else 0,
                "average_order_value": float(row[3]) if row[3] else 0
            })
        
        return AnalyticsResponse(
            success=True,
            data={
                "daily_sales": daily_sales,
                "period_days": days
            }
        )
    except Exception as e:
        logger.error(f"Failed to get daily sales: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products/top-selling")
async def get_top_selling_products(limit: int = Query(default=10, ge=1, le=100)):
    """Get top selling products"""
    try:
        results = clickhouse_client.get_top_products(limit)
        
        products = []
        for row in results:
            products.append({
                "product_id": row[0],
                "product_name": row[1],
                "total_quantity": row[2],
                "total_revenue": float(row[3]),
                "order_count": row[4]
            })
        
        return AnalyticsResponse(
            success=True,
            data={
                "products": products,
                "limit": limit
            }
        )
    except Exception as e:
        logger.error(f"Failed to get top products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/status-distribution")
async def get_order_status_distribution():
    """Get order status distribution"""
    try:
        results = clickhouse_client.get_order_status_distribution()
        
        total = sum(row[1] for row in results)
        distribution = []
        
        for row in results:
            status = row[0] if row[0] else 'unknown'
            count = row[1]
            percentage = (count / total * 100) if total > 0 else 0
            
            distribution.append({
                "status": status,
                "count": count,
                "percentage": round(percentage, 2)
            })
        
        return AnalyticsResponse(
            success=True,
            data={
                "distribution": distribution,
                "total_orders": total
            }
        )
    except Exception as e:
        logger.error(f"Failed to get order status distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
async def get_dashboard_metrics():
    """Get comprehensive dashboard metrics"""
    try:
        # Get total metrics
        total_metrics = clickhouse_client.get_total_metrics()
        
        # Get recent sales (last 7 days)
        recent_sales = clickhouse_client.get_daily_sales(7)
        
        # Get top products
        top_products = clickhouse_client.get_top_products(5)
        
        # Get status distribution
        status_dist = clickhouse_client.get_order_status_distribution()
        
        # Format daily sales
        daily_sales = []
        for row in recent_sales:
            daily_sales.append({
                "date": str(row[0]),
                "total_orders": row[1],
                "total_revenue": float(row[2]) if row[2] else 0
            })
        
        # Format top products
        products = []
        for row in top_products:
            products.append({
                "product_name": row[1],
                "total_quantity": row[2],
                "total_revenue": float(row[3])
            })
        
        # Format status distribution
        total_status = sum(row[1] for row in status_dist)
        distribution = []
        for row in status_dist:
            status = row[0] if row[0] else 'unknown'
            count = row[1]
            distribution.append({
                "status": status,
                "count": count,
                "percentage": round((count / total_status * 100) if total_status > 0 else 0, 2)
            })
        
        return AnalyticsResponse(
            success=True,
            data={
                "overview": {
                    "total_orders": total_metrics[0],
                    "total_revenue": float(total_metrics[1]) if total_metrics[1] else 0,
                    "average_order_value": float(total_metrics[2]) if total_metrics[2] else 0
                },
                "recent_sales": daily_sales,
                "top_products": products,
                "order_status": distribution,
                "last_updated": datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Failed to get dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sales/by-category")
async def get_sales_by_category():
    """Get sales metrics grouped by product category"""
    try:
        results = clickhouse_client.client.execute("""
            SELECT 
                splitByChar('/', product_name)[1] as category,
                count(DISTINCT order_id) as order_count,
                sum(quantity) as total_quantity,
                sum(subtotal) as total_revenue
            FROM order_items_analytics
            GROUP BY category
            ORDER BY total_revenue DESC
        """)
        
        categories = []
        for row in results:
            categories.append({
                "category": row[0],
                "order_count": row[1],
                "total_quantity": row[2],
                "total_revenue": float(row[3])
            })
        
        return AnalyticsResponse(
            success=True,
            data={"categories": categories}
        )
    except Exception as e:
        logger.error(f"Failed to get sales by category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/activity")
async def get_user_activity(days: int = Query(default=30, ge=1, le=365)):
    """Get user activity metrics"""
    try:
        results = clickhouse_client.client.execute(f"""
            SELECT 
                user_id,
                count() as order_count,
                sum(total_amount) as total_spent,
                max(timestamp) as last_order_date
            FROM order_events
            WHERE event_type = 'order.created'
              AND timestamp >= now() - INTERVAL {days} DAY
            GROUP BY user_id
            ORDER BY total_spent DESC
            LIMIT 20
        """)
        
        users = []
        for row in results:
            users.append({
                "user_id": row[0],
                "order_count": row[1],
                "total_spent": float(row[2]) if row[2] else 0,
                "last_order_date": str(row[3])
            })
        
        return AnalyticsResponse(
            success=True,
            data={
                "top_users": users,
                "period_days": days
            }
        )
    except Exception as e:
        logger.error(f"Failed to get user activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))
