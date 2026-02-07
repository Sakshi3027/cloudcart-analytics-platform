from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrderEvent(BaseModel):
    event_id: str
    order_id: str
    user_id: str
    event_type: str
    timestamp: str
    total_amount: Optional[float] = None
    status: Optional[str] = None
    items: Optional[List[dict]] = None

class DailySalesMetrics(BaseModel):
    date: str
    total_orders: int
    total_revenue: float
    average_order_value: float
    
class ProductSalesMetrics(BaseModel):
    product_id: str
    product_name: str
    total_quantity: int
    total_revenue: float
    order_count: int

class OrderStatusMetrics(BaseModel):
    status: str
    count: int
    percentage: float

class AnalyticsResponse(BaseModel):
    success: bool
    data: dict
    message: Optional[str] = None
