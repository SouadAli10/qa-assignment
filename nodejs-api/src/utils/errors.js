import { errorLogger } from './logger.js';

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

// Error response formatter
export const formatErrorResponse = (error, request) => {
  const response = {
    error: error.message || 'Internal Server Error',
    statusCode: error.statusCode || 500,
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
  };

  // Add request ID if available
  if (request.id) {
    response.requestId = request.id;
  }

  // Add validation details if available
  if (error.details) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return async (request, reply) => {
    try {
      await fn(request, reply);
    } catch (error) {
      // Let Fastify error handler deal with it
      throw error;
    }
  };
};

// Global error handler for Fastify
export const errorHandler = (error, request, reply) => {
  // Log the error
  errorLogger.error('Request error', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    },
    request: {
      id: request.id,
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      params: request.params,
      query: request.query,
    },
  });

  // Handle specific error types
  let statusCode = 500;
  let response = {
    error: 'Internal Server Error',
    statusCode: 500,
    code: 'INTERNAL_ERROR',
  };

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    response = formatErrorResponse(error, request);
  } else if (error.validation) {
    // Fastify validation error
    statusCode = 400;
    response = {
      error: 'Validation failed',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: error.validation,
    };
  } else if (error.statusCode) {
    // HTTP errors
    statusCode = error.statusCode;
    response = formatErrorResponse(error, request);
  } else {
    // Unknown errors
    response = formatErrorResponse(error, request);
  }

  reply.status(statusCode).send(response);
};

// Database error handler
export const handleDatabaseError = (error, operation = 'database operation') => {
  errorLogger.error(`Database error during ${operation}`, {
    error: error.message,
    code: error.code,
    errno: error.errno,
  });

  if (error.code === 'SQLITE_CONSTRAINT') {
    throw new ConflictError('Resource already exists');
  }

  throw new DatabaseError(`Failed to perform ${operation}`, error);
};

// Promise rejection handler
export const handleUnhandledRejection = (reason, promise) => {
  errorLogger.error('Unhandled Promise Rejection', {
    reason: reason?.toString(),
    stack: reason?.stack,
    promise: promise?.toString(),
  });

  // In production, you might want to gracefully shutdown
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

// Uncaught exception handler
export const handleUncaughtException = (error) => {
  errorLogger.fatal('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });

  process.exit(1);
};

// Setup global error handlers
export const setupGlobalErrorHandlers = () => {
  process.on('unhandledRejection', handleUnhandledRejection);
  process.on('uncaughtException', handleUncaughtException);
};

export default {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  formatErrorResponse,
  asyncHandler,
  errorHandler,
  handleDatabaseError,
  setupGlobalErrorHandlers,
};