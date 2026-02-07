require('dotenv').config();
const app = require('./app');
const { initDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { connectProducer } = require('./kafka/kafkaClient');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3003;

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

const startServer = async () => {
  try {
    await initDB();
    await connectRedis();
    await connectProducer();

    const server = app.listen(PORT, () => {
      logger.info(`Order Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
