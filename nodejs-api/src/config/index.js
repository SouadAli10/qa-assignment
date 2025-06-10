import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version info
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf8')
);

export const config = {
  // Server configuration
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT) || 3000,
  },

  // Database configuration
  database: {
    path: process.env.DATABASE_PATH || './todos.db',
    testPath: ':memory:',
  },

  // Application configuration
  app: {
    name: process.env.APP_NAME || 'Todo API',
    version: packageJson.version,
    environment: process.env.NODE_ENV || 'development',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    prettyPrint: process.env.NODE_ENV !== 'production',
  },

  // Swagger configuration
  swagger: {
    routePrefix: '/docs',
    exposeRoute: process.env.NODE_ENV !== 'production',
    swagger: {
      info: {
        title: 'Todo API',
        description: 'A comprehensive Todo API built with Fastify',
        version: packageJson.version,
      },
      host: `localhost:${parseInt(process.env.PORT) || 3000}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'todos', description: 'Todo operations' },
        { name: 'health', description: 'Health check endpoints' },
      ],
    },
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  },

  // CORS configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || false
      : true,
    credentials: process.env.NODE_ENV !== 'production',
  },

  // Rate limiting configuration
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
  },

  // Security configuration
  security: {
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    },
  },
};

// Environment helpers
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isTest = () => config.app.environment === 'test';

// Validation schema for environment variables
export const envSchema = {
  type: 'object',
  required: [],
  properties: {
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      default: 'development',
    },
    HOST: {
      type: 'string',
      default: '0.0.0.0',
    },
    PORT: {
      type: 'string',
      default: '3000',
    },
    DATABASE_PATH: {
      type: 'string',
      default: './todos.db',
    },
    LOG_LEVEL: {
      type: 'string',
      enum: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
      default: 'info',
    },
    RATE_LIMIT_MAX: {
      type: 'string',
      default: '100',
    },
    RATE_LIMIT_WINDOW: {
      type: 'string',
      default: '1 minute',
    },
  },
};

export default config;