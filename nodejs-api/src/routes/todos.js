import { TodoController } from '../controllers/TodoController.js';
import { validateSchema, IdSchema, CreateTodoSchema, UpdateTodoSchema, QueryParamsSchema } from '../utils/validation.js';

async function todoRoutes(fastify, options) {
  const todoController = new TodoController();

  // Swagger schemas
  const todoSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      title: { type: 'string' },
      description: { type: 'string', nullable: true },
      completed: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  };

  // Routes
  fastify.get('/', {
    schema: {
      description: 'Get all todos',
      tags: ['todos'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          per_page: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          sort: { type: 'string', enum: ['id', 'title', 'completed', 'created_at', 'updated_at'], default: 'created_at' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string' },
          completed: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: todoSchema },
            total: { type: 'integer' },
            page: { type: 'integer' },
            per_page: { type: 'integer' },
            total_pages: { type: 'integer' }
          }
        }
      }
    },
    preHandler: validateSchema(QueryParamsSchema, 'query')
  }, todoController.getTodos);

  fastify.get('/stats', {
    schema: {
      description: 'Get todo statistics',
      tags: ['todos'],
      response: {
        200: {
          type: 'object',
          properties: {
            total_todos: { type: 'integer' },
            completed_todos: { type: 'integer' },
            pending_todos: { type: 'integer' },
            completion_rate: { type: 'integer' }
          }
        }
      }
    }
  }, todoController.getTodoStats);

  fastify.get('/:id', {
    schema: {
      description: 'Get todo by ID',
      tags: ['todos'],
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: {
        200: todoSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    },
    preHandler: validateSchema(IdSchema, 'params')
  }, todoController.getTodo);

  fastify.post('/', {
    schema: {
      description: 'Create new todo',
      tags: ['todos'],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', maxLength: 1000 },
          completed: { type: 'boolean', default: false }
        }
      },
      response: {
        201: todoSchema
      }
    },
    preHandler: validateSchema(CreateTodoSchema, 'body')
  }, todoController.createTodo);

  fastify.put('/:id', {
    schema: {
      description: 'Update todo',
      tags: ['todos'],
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', maxLength: 1000 },
          completed: { type: 'boolean' }
        }
      },
      response: {
        200: todoSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    },
    preHandler: [
      validateSchema(IdSchema, 'params'),
      validateSchema(UpdateTodoSchema, 'body')
    ]
  }, todoController.updateTodo);

  fastify.delete('/:id', {
    schema: {
      description: 'Delete todo',
      tags: ['todos'],
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: {
        204: { type: 'null' },
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    },
    preHandler: validateSchema(IdSchema, 'params')
  }, todoController.deleteTodo);

  fastify.patch('/:id/toggle', {
    schema: {
      description: 'Toggle todo completion',
      tags: ['todos'],
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: {
        200: todoSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } }
      }
    },
    preHandler: validateSchema(IdSchema, 'params')
  }, todoController.toggleCompletion);
}

export default todoRoutes;