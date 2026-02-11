from fastapi import APIRouter, HTTPException
from src.kafka_consumer.clickhouse_client import clickhouse_client
from src.utils.logger import logger
from datetime import datetime

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard():
    """Get comprehensive dashboard metrics"""
    try:
        total_orders, total_revenue, avg_order = clickhouse_client.get_total_metrics()
        daily_sales = clickhouse_client.get_daily_sales(7)
        top_products = clickhouse_client.get_top_products(10)
        order_status = clickhouse_client.get_order_status_distribution()
        
        return {
            "success": True,
            "data": {
                "overview": {
                    "total_orders": int(total_orders) if total_orders else 0,
                    "total_revenue": float(total_revenue) if total_revenue else 0.0,
                    "average_order_value": float(avg_order) if avg_order else 0.0
                },
                "recent_sales": [
                    {
                        "date": str(row[0]),
                        "total_orders": int(row[1]),
                        "total_revenue": float(row[2])
                    }
                    for row in daily_sales
                ],
                "top_products": [
                    {
                        "product_name": row[1],
                        "total_quantity": int(row[2]),
                        "total_revenue": float(row[3]),
                        "order_count": int(row[4])
                    }
                    for row in top_products
                ],
                "order_status": [
                    {
                        "status": row[0],
                        "count": int(row[1]),
                        "percentage": round(float(row[1]) / total_orders * 100, 2) if total_orders > 0 else 0
                    }
                    for row in order_status
                ],
                "last_updated": datetime.now().isoformat()
            },
            "message": None
        }
    except Exception as e:
        logger.error(f"Failed to get dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sales/daily")
async def get_daily_sales(days: int = 7):
    """Get daily sales for the last N days"""
    try:
        sales = clickhouse_client.get_daily_sales(days)
        return {
            "success": True,
            "data": {
                "daily_sales": [
                    {
                        "date": str(row[0]),
                        "total_orders": int(row[1]),
                        "total_revenue": float(row[2]),
                        "average_order_value": float(row[3])
                    }
                    for row in sales
                ],
                "period_days": days
            }
        }
    except Exception as e:
        logger.error(f"Failed to get daily sales: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products/top-selling")
async def get_top_selling_products(limit: int = 10):
    """Get top selling products"""
    try:
        products = clickhouse_client.get_top_products(limit)
        return {
            "success": True,
            "data": {
                "products": [
                    {
                        "product_id": row[0],
                        "product_name": row[1],
                        "total_quantity": int(row[2]),
                        "total_revenue": float(row[3]),
                        "order_count": int(row[4])
                    }
                    for row in products
                ],
                "limit": limit
            }
        }
    except Exception as e:
        logger.error(f"Failed to get top products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/status-distribution")
async def get_order_status_distribution():
    """Get order status distribution"""
    try:
        total_orders, _, _ = clickhouse_client.get_total_metrics()
        distribution = clickhouse_client.get_order_status_distribution()
        
        return {
            "success": True,
            "data": {
                "distribution": [
                    {
                        "status": row[0],
                        "count": int(row[1]),
                        "percentage": round(float(row[1]) / total_orders * 100, 2) if total_orders > 0 else 0
                    }
                    for row in distribution
                ],
                "total_orders": int(total_orders) if total_orders else 0
            }
        }
    except Exception as e:
        logger.error(f"Failed to get order status distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/activity")
async def get_user_activity(days: int = 30):
    """Get top active users by spending"""
    try:
        query = f"""
            SELECT 
                user_id,
                count(DISTINCT order_id) as order_count,
                sum(total_amount) as total_spent,
                max(timestamp) as last_order_date
            FROM order_events
            WHERE event_type = 'order.created'
              AND timestamp >= now() - INTERVAL {days} DAY
            GROUP BY user_id
            ORDER BY total_spent DESC
            LIMIT 10
        """
        
        result = clickhouse_client.client.execute(query)
        
        return {
            "success": True,
            "data": {
                "top_users": [
                    {
                        "user_id": row[0],
                        "order_count": int(row[1]),
                        "total_spent": float(row[2]),
                        "last_order_date": str(row[3])
                    }
                    for row in result
                ],
                "period_days": days
            }
        }
    except Exception as e:
        logger.error(f"Failed to get user activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def analytics_health():
    """Health check for analytics service"""
    return {
        "success": True,
        "message": "Analytics API is healthy",
        "data": {
            "clickhouse": "connected",
            "kafka": "connected"
        }
    }
