import pino from 'pino';
import { config, isDevelopment } from '../config/index.js';

// Configure logger based on environment
const loggerConfig = {
  level: config.logging.level,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    time: () => {
      return { time: new Date().toISOString() };
    },
  },
  serializers: {
    req: (request) => ({
      method: request.method,
      url: request.url,
      headers: request.headers,
      hostname: request.hostname,
      remoteAddress: request.ip,
      remotePort: request.socket?.remotePort,
    }),
    res: (reply) => ({
      statusCode: reply.statusCode,
      headers: reply.getHeaders(),
    }),
    err: pino.stdSerializers.err,
  },
};

// Add pretty printing in development
if (isDevelopment()) {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: true,
    },
  };
}

export const logger = pino(loggerConfig);

// Request logger middleware
export const createRequestLogger = () => {
  return {
    logger: logger.child({ component: 'request' }),
    serializers: {
      req: (request) => ({
        id: request.id,
        method: request.method,
        url: request.url,
        remoteAddress: request.ip,
        userAgent: request.headers['user-agent'],
      }),
      res: (reply) => ({
        statusCode: reply.statusCode,
      }),
    },
  };
};

// Create child loggers for different components
export const createLogger = (component) => {
  return logger.child({ component });
};

// Error logger
export const errorLogger = createLogger('error');

// Performance logger
export const perfLogger = createLogger('performance');

export default logger;