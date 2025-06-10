import Fastify from 'fastify';
import { config } from './config/index.js';
import { database } from './database/index.js';
import { errorHandler, setupGlobalErrorHandlers } from './utils/errors.js';
import { createRequestLogger } from './utils/logger.js';
import todoRoutes from './routes/todos.js';

// Setup global error handlers
setupGlobalErrorHandlers();

async function createApp() {
  // Create Fastify instance
  const fastify = Fastify({
    logger: createRequestLogger(),
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  });

  // Set error handler
  fastify.setErrorHandler(errorHandler);

  // Register plugins (skip env plugin for now)
  // await fastify.register(import('@fastify/env'), {
  //   schema: config.envSchema,
  //   dotenv: true,
  // });

  await fastify.register(import('@fastify/cors'), config.cors);

  await fastify.register(import('@fastify/helmet'), config.security.helmet);

  await fastify.register(import('@fastify/rate-limit'), config.rateLimit);

  await fastify.register(import('@fastify/sensible'));

  if (config.swagger.exposeRoute) {
    await fastify.register(import('@fastify/swagger'), config.swagger);
    await fastify.register(import('@fastify/swagger-ui'), {
      routePrefix: config.swagger.routePrefix,
      uiConfig: config.swagger.uiConfig,
    });
  }

  await fastify.register(import('@fastify/under-pressure'), {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100000000,
    maxRssBytes: 100000000,
    maxEventLoopUtilization: 0.98,
  });

  // Health routes
  fastify.get('/health', async (request, reply) => {
    const dbHealth = await database.healthCheck();
    const health = {
      status: dbHealth.status === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      version: config.app.version,
      environment: config.app.environment,
      uptime: process.uptime(),
      database: dbHealth,
    };

    const statusCode = health.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(health);
  });

  fastify.get('/ready', async (request, reply) => {
    try {
      await database.healthCheck();
      return reply.send({ status: 'ready' });
    } catch (error) {
      return reply.status(503).send({ status: 'not ready', error: error.message });
    }
  });

  // API routes
  await fastify.register(todoRoutes, { prefix: '/api/todos' });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: 'Route not found',
      statusCode: 404,
      path: request.url,
      method: request.method,
    });
  });

  return fastify;
}

// Start server
const start = async () => {
  try {
    // Connect to database
    await database.connect();
    
    // Create app
    const fastify = await createApp();
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      fastify.log.info(`Received ${signal}, shutting down gracefully`);
      
      try {
        await fastify.close();
        await database.close();
        process.exit(0);
      } catch (error) {
        fastify.log.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Start server
    await fastify.listen({
      host: config.server.host,
      port: config.server.port,
    });

    fastify.log.info(`Server running on http://${config.server.host}:${config.server.port}`);
    
    if (config.swagger.exposeRoute) {
      fastify.log.info(`API documentation: http://${config.server.host}:${config.server.port}${config.swagger.routePrefix}`);
    }
    
    return fastify;
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

// Only start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  start();
}

export default createApp;