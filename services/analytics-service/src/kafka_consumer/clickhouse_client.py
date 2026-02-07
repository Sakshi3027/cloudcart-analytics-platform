from clickhouse_driver import Client
from src.utils.logger import logger
import os
import time
from datetime import datetime

class ClickHouseClient:
    def __init__(self):
        self.host = os.getenv('CLICKHOUSE_HOST', 'localhost')
        self.port = int(os.getenv('CLICKHOUSE_PORT', 9000))
        self.database = os.getenv('CLICKHOUSE_DATABASE', 'analytics')
        self.user = os.getenv('CLICKHOUSE_USER', 'default')
        self.password = os.getenv('CLICKHOUSE_PASSWORD', '')
        
        self.client = None
        self.connect_with_retry()
        self.init_database()
    
    def connect_with_retry(self, max_retries=10):
        for attempt in range(max_retries):
            try:
                self.client = Client(host=self.host, port=self.port, user=self.user, password=self.password)
                logger.info(f"Connected to ClickHouse at {self.host}:{self.port}")
                return
            except Exception as e:
                logger.warning(f"Failed to connect (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(5)
                else:
                    raise
    
    def init_database(self):
        try:
            self.client.execute(f"CREATE DATABASE IF NOT EXISTS {self.database}")
            logger.info(f"Database '{self.database}' created")
            
            self.client = Client(host=self.host, port=self.port, database=self.database, user=self.user, password=self.password)
            
            self.client.execute("""
                CREATE TABLE IF NOT EXISTS order_events (
                    event_id String, order_id String, user_id String, event_type String,
                    timestamp DateTime, total_amount Nullable(Float64), status Nullable(String),
                    created_at DateTime DEFAULT now()
                ) ENGINE = MergeTree() ORDER BY (timestamp, event_id)
            """)
            
            self.client.execute("""
                CREATE TABLE IF NOT EXISTS order_items_analytics (
                    order_id String, product_id String, product_name String,
                    quantity Int32, price Float64, subtotal Float64, timestamp DateTime,
                    created_at DateTime DEFAULT now()
                ) ENGINE = MergeTree() ORDER BY (timestamp, order_id, product_id)
            """)
            
            logger.info("ClickHouse tables initialized")
        except Exception as e:
            logger.error(f"Failed to init database: {e}")
            raise
    
    def parse_timestamp(self, ts):
        if isinstance(ts, str):
            ts = ts.replace('Z', '').replace('T', ' ').split('.')[0]
            return datetime.strptime(ts, '%Y-%m-%d %H:%M:%S')
        return ts
    
    def insert_order_event(self, event_data: dict):
        try:
            self.client.execute(
                "INSERT INTO order_events (event_id, order_id, user_id, event_type, timestamp, total_amount, status) VALUES",
                [{
                    'event_id': event_data.get('eventId') or event_data.get('event_id'),
                    'order_id': event_data.get('orderId') or event_data.get('order_id'),
                    'user_id': event_data.get('userId') or event_data.get('user_id'),
                    'event_type': event_data.get('event_type', 'unknown'),
                    'timestamp': self.parse_timestamp(event_data.get('timestamp')),
                    'total_amount': float(event_data.get('totalAmount', 0) or event_data.get('total_amount', 0)),
                    'status': event_data.get('status')
                }]
            )
            logger.info(f"Order event inserted: {event_data.get('orderId') or event_data.get('order_id')}")
        except Exception as e:
            logger.error(f"Failed to insert order event: {e}")
    
    def insert_order_items(self, order_id: str, items: list, timestamp: str):
        try:
            data = []
            for item in items:
                data.append({
                    'order_id': order_id,
                    'product_id': item.get('product_id'),
                    'product_name': item.get('product_name'),
                    'quantity': int(item.get('quantity')),
                    'price': float(str(item.get('price'))),
                    'subtotal': float(str(item.get('subtotal'))),
                    'timestamp': self.parse_timestamp(timestamp)
                })
            
            if data:
                self.client.execute(
                    "INSERT INTO order_items_analytics (order_id, product_id, product_name, quantity, price, subtotal, timestamp) VALUES",
                    data
                )
                logger.info(f"Order items inserted for order: {order_id}")
        except Exception as e:
            logger.error(f"Failed to insert order items: {e}")
    
    def get_daily_sales(self, days: int = 7):
        try:
            return self.client.execute(f"""
                SELECT toDate(timestamp) as date, count() as total_orders, 
                       sum(total_amount) as total_revenue, avg(total_amount) as avg_order
                FROM order_events WHERE event_type = 'order.created' 
                AND timestamp >= now() - INTERVAL {days} DAY
                GROUP BY date ORDER BY date DESC
            """)
        except Exception as e:
            logger.error(f"Failed to get daily sales: {e}")
            return []
    
    def get_top_products(self, limit: int = 10):
        try:
            return self.client.execute(f"""
                SELECT product_id, product_name, sum(quantity) as total_qty, 
                       sum(subtotal) as total_revenue, count(DISTINCT order_id) as order_count
                FROM order_items_analytics
                GROUP BY product_id, product_name ORDER BY total_revenue DESC LIMIT {limit}
            """)
        except Exception as e:
            logger.error(f"Failed to get top products: {e}")
            return []
    
    def get_order_status_distribution(self):
        try:
            return self.client.execute("""
                WITH latest_status AS (
                    SELECT order_id, argMax(status, timestamp) as current_status
                    FROM order_events WHERE status IS NOT NULL GROUP BY order_id
                )
                SELECT current_status as status, count() as count
                FROM latest_status GROUP BY current_status ORDER BY count DESC
            """)
        except Exception as e:
            logger.error(f"Failed to get status distribution: {e}")
            return []
    
    def get_total_metrics(self):
        try:
            result = self.client.execute("""
                SELECT count() as total_orders, sum(total_amount) as total_revenue, 
                       avg(total_amount) as avg_order
                FROM order_events WHERE event_type = 'order.created'
            """)
            return result[0] if result else (0, 0, 0)
        except Exception as e:
            logger.error(f"Failed to get total metrics: {e}")
            return (0, 0, 0)

clickhouse_client = ClickHouseClient()
