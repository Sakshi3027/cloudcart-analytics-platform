const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'order-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'order-service-group' });

// Topic names
const TOPICS = {
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_RELEASED: 'inventory.released',
  PAYMENT_PROCESSED: 'payment.processed',
  PAYMENT_FAILED: 'payment.failed',
};

// Connect producer
const connectProducer = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.error('Failed to connect Kafka producer:', error);
    throw error;
  }
};

// Connect consumer
const connectConsumer = async () => {
  try {
    await consumer.connect();
    logger.info('Kafka consumer connected');
  } catch (error) {
    logger.error('Failed to connect Kafka consumer:', error);
    throw error;
  }
};

// Publish event to Kafka
const publishEvent = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: message.orderId || message.id,
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
        },
      ],
    });
    logger.info('Event published to Kafka:', { topic, messageId: message.id });
    return true;
  } catch (error) {
    logger.error('Failed to publish event to Kafka:', error);
    throw error;
  }
};

// Subscribe to topics
const subscribeToTopics = async (topics) => {
  try {
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      logger.info('Subscribed to Kafka topic:', { topic });
    }
  } catch (error) {
    logger.error('Failed to subscribe to topics:', error);
    throw error;
  }
};

// Run consumer
const runConsumer = async (messageHandler) => {
  try {
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = JSON.parse(message.value.toString());
          logger.info('Received Kafka message:', { topic, partition, value });
          await messageHandler(topic, value);
        } catch (error) {
          logger.error('Error processing Kafka message:', error);
        }
      },
    });
  } catch (error) {
    logger.error('Failed to run Kafka consumer:', error);
    throw error;
  }
};

// Disconnect
const disconnect = async () => {
  await producer.disconnect();
  await consumer.disconnect();
  logger.info('Kafka disconnected');
};

module.exports = {
  kafka,
  producer,
  consumer,
  TOPICS,
  connectProducer,
  connectConsumer,
  publishEvent,
  subscribeToTopics,
  runConsumer,
  disconnect,
};
