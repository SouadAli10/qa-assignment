import { TodoRepository } from '../repositories/TodoRepository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TodoService');

export class TodoService {
  constructor(todoRepository = null) {
    this.todoRepository = todoRepository || new TodoRepository();
  }

  /**
   * Get all todos with filtering, sorting, and pagination
   */
  async getTodos(options = {}) {
    try {
      logger.info('Getting todos', { options });

      // Validate and sanitize options
      const validatedOptions = this.validateQueryOptions(options);
      
      const result = await this.todoRepository.findAll(validatedOptions);
      
      logger.info('Retrieved todos successfully', {
        count: result.data.length,
        total: result.pagination.total,
        page: result.pagination.page,
      });

      return {
        data: result.data.map(todo => todo.toJSON()),
        ...result.pagination,
      };
    } catch (error) {
      logger.error('Failed to get todos', { error: error.message, options });
      throw error;
    }
  }

  /**
   * Get todo by ID
   */
  async getTodoById(id) {
    try {
      logger.info('Getting todo by ID', { id });

      this.validateId(id);
      
      const todo = await this.todoRepository.findById(id);
      
      if (!todo) {
        logger.warn('Todo not found', { id });
        throw new NotFoundError('Todo');
      }

      logger.info('Retrieved todo successfully', { id, title: todo.title });
      return todo.toJSON();
    } catch (error) {
      logger.error('Failed to get todo by ID', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Create a new todo
   */
  async createTodo(todoData) {
    try {
      logger.info('Creating todo', { title: todoData.title });

      // Validate todo data
      this.validateTodoData(todoData);

      // Sanitize data
      const sanitizedData = this.sanitizeTodoData(todoData);

      const todo = await this.todoRepository.create(sanitizedData);
      
      logger.info('Created todo successfully', { 
        id: todo.id, 
        title: todo.title 
      });

      return todo.toJSON();
    } catch (error) {
      logger.error('Failed to create todo', { 
        error: error.message, 
        todoData 
      });
      throw error;
    }
  }

  /**
   * Update todo by ID
   */
  async updateTodo(id, updates) {
    try {
      logger.info('Updating todo', { id, updates: Object.keys(updates) });

      this.validateId(id);
      this.validateUpdateData(updates);

      // Sanitize updates
      const sanitizedUpdates = this.sanitizeUpdateData(updates);

      if (Object.keys(sanitizedUpdates).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      const todo = await this.todoRepository.update(id, sanitizedUpdates);
      
      logger.info('Updated todo successfully', { 
        id, 
        title: todo.title 
      });

      return todo.toJSON();
    } catch (error) {
      logger.error('Failed to update todo', { 
        error: error.message, 
        id, 
        updates 
      });
      throw error;
    }
  }

  /**
   * Delete todo by ID
   */
  async deleteTodo(id) {
    try {
      logger.info('Deleting todo', { id });

      this.validateId(id);
      
      await this.todoRepository.delete(id);
      
      logger.info('Deleted todo successfully', { id });
      return true;
    } catch (error) {
      logger.error('Failed to delete todo', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get todo statistics
   */
  async getTodoStats() {
    try {
      logger.info('Getting todo statistics');

      const stats = await this.todoRepository.getStats();
      
      // Add computed statistics
      const computedStats = {
        ...stats,
        completion_rate: stats.total_todos > 0 
          ? Math.round((stats.completed_todos / stats.total_todos) * 100) 
          : 0,
        last_updated: new Date().toISOString(),
      };

      logger.info('Retrieved todo statistics', computedStats);
      return computedStats;
    } catch (error) {
      logger.error('Failed to get todo statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Search todos
   */
  async searchTodos(query, options = {}) {
    try {
      logger.info('Searching todos', { query, options });

      if (!query || query.trim().length === 0) {
        throw new ValidationError('Search query is required');
      }

      if (query.length > 255) {
        throw new ValidationError('Search query too long');
      }

      const searchOptions = {
        ...options,
        search: query.trim(),
      };

      return await this.getTodos(searchOptions);
    } catch (error) {
      logger.error('Failed to search todos', { 
        error: error.message, 
        query, 
        options 
      });
      throw error;
    }
  }

  /**
   * Toggle todo completion status
   */
  async toggleTodoCompletion(id) {
    try {
      logger.info('Toggling todo completion', { id });

      const todo = await this.todoRepository.findById(id);
      if (!todo) {
        throw new NotFoundError('Todo');
      }

      const updated = await this.todoRepository.update(id, {
        completed: !todo.completed,
      });

      logger.info('Toggled todo completion', { 
        id, 
        completed: updated.completed 
      });

      return updated.toJSON();
    } catch (error) {
      logger.error('Failed to toggle todo completion', { 
        error: error.message, 
        id 
      });
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  async bulkUpdateTodos(ids, updates) {
    try {
      logger.info('Bulk updating todos', { count: ids.length, updates });

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('IDs array is required');
      }

      // Validate all IDs
      ids.forEach(id => this.validateId(id));
      this.validateUpdateData(updates);

      const sanitizedUpdates = this.sanitizeUpdateData(updates);
      const results = [];

      for (const id of ids) {
        try {
          const todo = await this.todoRepository.update(id, sanitizedUpdates);
          results.push(todo.toJSON());
        } catch (error) {
          if (error instanceof NotFoundError) {
            // Skip missing todos but log the warning
            logger.warn('Todo not found during bulk update', { id });
          } else {
            throw error;
          }
        }
      }

      logger.info('Bulk updated todos', { 
        requested: ids.length, 
        updated: results.length 
      });

      return results;
    } catch (error) {
      logger.error('Failed to bulk update todos', { 
        error: error.message, 
        ids, 
        updates 
      });
      throw error;
    }
  }

  async bulkDeleteTodos(ids) {
    try {
      logger.info('Bulk deleting todos', { count: ids.length });

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('IDs array is required');
      }

      // Validate all IDs
      ids.forEach(id => this.validateId(id));

      const deletedCount = await this.todoRepository.deleteMany(ids);

      logger.info('Bulk deleted todos', { 
        requested: ids.length, 
        deleted: deletedCount 
      });

      return { deleted: deletedCount };
    } catch (error) {
      logger.error('Failed to bulk delete todos', { 
        error: error.message, 
        ids 
      });
      throw error;
    }
  }

  // Private validation methods
  validateId(id) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new ValidationError('Invalid ID: must be a positive integer');
    }
  }

  validateTodoData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid todo data: must be an object');
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new ValidationError('Title is required');
    }

    if (data.title.length > 255) {
      throw new ValidationError('Title cannot exceed 255 characters');
    }

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string') {
        throw new ValidationError('Description must be a string');
      }
      if (data.description.length > 1000) {
        throw new ValidationError('Description cannot exceed 1000 characters');
      }
    }

    if (data.completed !== undefined && typeof data.completed !== 'boolean') {
      throw new ValidationError('Completed must be a boolean');
    }
  }

  validateUpdateData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid update data: must be an object');
    }

    if (Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided');
    }

    const allowedFields = ['title', 'description', 'completed'];
    const invalidFields = Object.keys(data).filter(key => !allowedFields.includes(key));
    
    if (invalidFields.length > 0) {
      throw new ValidationError(`Invalid fields: ${invalidFields.join(', ')}`);
    }

    // Validate individual fields if present
    if ('title' in data) {
      if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
        throw new ValidationError('Title cannot be empty');
      }
      if (data.title.length > 255) {
        throw new ValidationError('Title cannot exceed 255 characters');
      }
    }

    if ('description' in data && data.description !== null) {
      if (typeof data.description !== 'string') {
        throw new ValidationError('Description must be a string');
      }
      if (data.description.length > 1000) {
        throw new ValidationError('Description cannot exceed 1000 characters');
      }
    }

    if ('completed' in data && typeof data.completed !== 'boolean') {
      throw new ValidationError('Completed must be a boolean');
    }
  }

  validateQueryOptions(options) {
    const defaults = {
      page: 1,
      per_page: 20,
      sort: 'created_at',
      order: 'desc',
    };

    const validated = { ...defaults, ...options };

    // Validate page
    if (validated.page < 1) {
      validated.page = 1;
    }

    // Validate per_page
    if (validated.per_page < 1 || validated.per_page > 100) {
      validated.per_page = 20;
    }

    // Validate sort field
    const allowedSortFields = ['id', 'title', 'completed', 'created_at', 'updated_at'];
    if (!allowedSortFields.includes(validated.sort)) {
      validated.sort = 'created_at';
    }

    // Validate order
    if (!['asc', 'desc'].includes(validated.order)) {
      validated.order = 'desc';
    }

    // Validate search
    if (validated.search && validated.search.length > 255) {
      throw new ValidationError('Search query too long');
    }

    return validated;
  }

  sanitizeTodoData(data) {
    return {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      completed: Boolean(data.completed),
    };
  }

  sanitizeUpdateData(data) {
    const sanitized = {};

    if ('title' in data) {
      sanitized.title = data.title.trim();
    }

    if ('description' in data) {
      sanitized.description = data.description?.trim() || null;
    }

    if ('completed' in data) {
      sanitized.completed = Boolean(data.completed);
    }

    return sanitized;
  }
}

export default TodoService;