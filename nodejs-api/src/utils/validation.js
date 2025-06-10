import { z } from 'zod';

// Common validation schemas
export const IdSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const CreateTodoSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title cannot exceed 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional()
    .nullable(),
  completed: z.boolean().default(false),
});

export const UpdateTodoSchema = z.object({
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional()
    .nullable(),
  completed: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export const QueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['id', 'title', 'completed', 'created_at', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(255).optional(),
  completed: z.coerce.boolean().optional(),
});

// Validation middleware factory
export const validateSchema = (schema, source = 'body') => {
  return async (request, reply) => {
    try {
      const data = source === 'params' ? request.params 
                 : source === 'query' ? request.query 
                 : request.body;

      const validatedData = await schema.parseAsync(data);
      
      // Replace the original data with validated data
      if (source === 'params') {
        request.params = validatedData;
      } else if (source === 'query') {
        request.query = validatedData;
      } else {
        request.body = validatedData;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return reply.status(400).send({
          error: 'Validation failed',
          details: validationErrors,
        });
      }
      throw error;
    }
  };
};

// Helper to create validation error response
export const createValidationError = (message, details = []) => {
  return {
    error: message,
    details,
    statusCode: 400,
  };
};

// Transform empty strings to null (useful for optional fields)
export const emptyStringToNull = (value) => {
  return value === '' ? null : value;
};

// Custom Zod transforms
export const preprocessEmptyString = z.preprocess(emptyStringToNull, z.string().nullable());

export default {
  IdSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  QueryParamsSchema,
  validateSchema,
  createValidationError,
};