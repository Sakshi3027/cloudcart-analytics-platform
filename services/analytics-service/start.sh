#!/bin/bash
set -e

echo "Starting Analytics Service..."

# Start Kafka consumer in background
python consumer.py &
CONSUMER_PID=$!
echo "Kafka consumer started with PID: $CONSUMER_PID"

# Start FastAPI server
echo "Starting FastAPI server..."
python -m uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-3004}

# Clean up consumer on exit
trap "kill $CONSUMER_PID 2>/dev/null" EXIT
