#!/usr/bin/env python3
"""
Kafka Consumer Entry Point
Runs the Kafka consumer to process order events
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.kafka_consumer.consumer import event_consumer
from src.utils.logger import logger

if __name__ == "__main__":
    logger.info("Starting Analytics Service - Kafka Consumer")
    try:
        event_consumer.start()
    except KeyboardInterrupt:
        logger.info("Consumer stopped by user")
    except Exception as e:
        logger.error(f"Consumer failed: {e}")
        sys.exit(1)
