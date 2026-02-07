from kafka import KafkaConsumer
import json
import os
from src.utils.logger import logger
from src.kafka_consumer.clickhouse_client import clickhouse_client
import time

class OrderEventConsumer:
    def __init__(self):
        self.brokers = os.getenv('KAFKA_BROKERS', 'localhost:9092').split(',')
        self.group_id = os.getenv('KAFKA_GROUP_ID', 'analytics-service-group')
        self.topics = os.getenv('KAFKA_TOPICS', 'order.created,order.confirmed').split(',')
        self.consumer = None
        
    def connect(self):
        """Connect to Kafka"""
        max_retries = 10
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                self.consumer = KafkaConsumer(
                    *self.topics,
                    bootstrap_servers=self.brokers,
                    group_id=self.group_id,
                    auto_offset_reset='earliest',
                    enable_auto_commit=True,
                    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
                )
                logger.info(f"Kafka consumer connected. Subscribed to topics: {self.topics}")
                return True
            except Exception as e:
                retry_count += 1
                logger.error(f"Failed to connect to Kafka (attempt {retry_count}/{max_retries}): {e}")
                if retry_count < max_retries:
                    time.sleep(5)
                else:
                    raise
        return False
    
    def process_event(self, topic: str, event_data: dict):
        """Process incoming Kafka event"""
        try:
            logger.info(f"Processing event from topic: {topic}")
            logger.debug(f"Event data: {event_data}")
            
            # Determine event type from topic
            event_type = topic.replace('.', '_')
            event_data['event_type'] = topic
            
            # Insert event into ClickHouse
            clickhouse_client.insert_order_event(event_data)
            
            # If it's an order creation event, also insert items
            if topic == 'order.created' and 'items' in event_data:
                clickhouse_client.insert_order_items(
                    order_id=event_data.get('orderId') or event_data.get('order_id'),
                    items=event_data['items'],
                    timestamp=event_data.get('timestamp')
                )
            
            logger.info(f"Event processed successfully: {topic}")
        except Exception as e:
            logger.error(f"Failed to process event: {e}")
    
    def start(self):
        """Start consuming messages"""
        if not self.consumer:
            self.connect()
        
        logger.info("Starting Kafka consumer...")
        try:
            for message in self.consumer:
                self.process_event(message.topic, message.value)
        except KeyboardInterrupt:
            logger.info("Consumer interrupted by user")
        except Exception as e:
            logger.error(f"Consumer error: {e}")
        finally:
            self.close()
    
    def close(self):
        """Close consumer connection"""
        if self.consumer:
            self.consumer.close()
            logger.info("Kafka consumer closed")

# Create consumer instance
event_consumer = OrderEventConsumer()
