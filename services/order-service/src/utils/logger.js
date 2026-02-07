const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'order-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          // Filter out circular references and non-serializable objects
          const safeMetaStr = (() => {
            try {
              const filtered = Object.keys(meta)
                .filter(key => {
                  const value = meta[key];
                  return !(value && typeof value === 'object' && 
                          (value.constructor.name === 'ClientRequest' || 
                           value.constructor.name === 'IncomingMessage'));
                })
                .reduce((obj, key) => {
                  obj[key] = meta[key];
                  return obj;
                }, {});
              
              return Object.keys(filtered).length ? JSON.stringify(filtered, null, 2) : '';
            } catch (e) {
              return '';
            }
          })();
          
          return `${timestamp} [${service}] ${level}: ${message} ${safeMetaStr}`;
        })
      ),
    }),
  ],
});

module.exports = logger;
