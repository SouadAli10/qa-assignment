import { database } from '../database/index.js';
import { Todo } from '../models/Todo.js';
import { NotFoundError, DatabaseError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TodoRepository');

export class TodoRepository {
  constructor(db = null) {
    this.db = db || database.getDb();
  }

  /**
   * Get all todos with optional filtering, sorting, and pagination
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        per_page = 20,
        sort = 'created_at',
        order = 'desc',
        search,
        completed,
      } = options;

      // Build WHERE clause
      const whereConditions = [];
      const params = [];

      if (search) {
        whereConditions.push('(title LIKE ? OR description LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (completed !== undefined) {
        whereConditions.push('completed = ?');
        params.push(completed ? 1 : 0);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM todos ${whereClause}`;
      const countResult = await this.db.get(countQuery, params);
      const total = countResult.total;

      // Build main query with pagination and sorting
      const offset = (page - 1) * per_page;
      const orderClause = `ORDER BY ${sort} ${order.toUpperCase()}`;
      const limitClause = `LIMIT ? OFFSET ?`;

      const query = `
        SELECT id, title, description, completed, created_at, updated_at 
        FROM todos 
        ${whereClause} 
        ${orderClause} 
        ${limitClause}
      `;

      const queryParams = [...params, per_page, offset];
      const rows = await this.db.all(query, queryParams);

      const todos = rows.map(row => Todo.fromDb(row));

      logger.debug('Retrieved todos', {
        count: todos.length,
        total,
        page,
        per_page,
        search,
        completed,
      });

      return {
        data: todos,
        pagination: {
          total,
          page,
          per_page,
          total_pages: Math.ceil(total / per_page),
        },
      };
    } catch (error) {
      logger.error('Failed to find all todos', { error: error.message, options });
      throw new DatabaseError('Failed to retrieve todos', error);
    }
  }

  /**
   * Find todo by ID
   */
  async findById(id) {
    try {
      const query = `
        SELECT id, title, description, completed, created_at, updated_at 
        FROM todos 
        WHERE id = ?
      `;

      const row = await this.db.get(query, [id]);

      if (!row) {
        logger.debug('Todo not found', { id });
        return null;
      }

      const todo = Todo.fromDb(row);
      logger.debug('Retrieved todo by ID', { id, title: todo.title });

      return todo;
    } catch (error) {
      logger.error('Failed to find todo by ID', { error: error.message, id });
      throw new DatabaseError('Failed to retrieve todo', error);
    }
  }

  /**
   * Create a new todo
   */
  async create(todoData) {
    try {
      const todo = new Todo(todoData);
      
      // Validate todo
      if (!todo.isValid()) {
        const errors = todo.getValidationErrors();
        throw new ValidationError('Invalid todo data', errors);
      }

      const query = `
        INSERT INTO todos (title, description, completed) 
        VALUES (?, ?, ?)
      `;

      const dbData = todo.toDb();
      const result = await this.db.run(query, [
        dbData.title,
        dbData.description,
        dbData.completed,
      ]);

      // Fetch the created todo with timestamps
      const createdTodo = await this.findById(result.lastID);
      
      logger.info('Created todo', { 
        id: createdTodo.id, 
        title: createdTodo.title 
      });

      return createdTodo;
    } catch (error) {
      logger.error('Failed to create todo', { 
        error: error.message, 
        todoData 
      });
      throw new DatabaseError('Failed to create todo', error);
    }
  }

  /**
   * Update todo by ID
   */
  async update(id, updates) {
    try {
      // First check if todo exists
      const existingTodo = await this.findById(id);
      if (!existingTodo) {
        throw new NotFoundError('Todo');
      }

      // Build update query dynamically
      const updateFields = [];
      const params = [];

      if ('title' in updates) {
        updateFields.push('title = ?');
        params.push(updates.title);
      }

      if ('description' in updates) {
        updateFields.push('description = ?');
        params.push(updates.description);
      }

      if ('completed' in updates) {
        updateFields.push('completed = ?');
        params.push(updates.completed ? 1 : 0);
      }

      if (updateFields.length === 0) {
        return existingTodo; // No updates to perform
      }

      // Add updated_at timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `
        UPDATE todos 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;

      await this.db.run(query, params);

      // Fetch the updated todo
      const updatedTodo = await this.findById(id);
      
      logger.info('Updated todo', { 
        id, 
        updates: Object.keys(updates),
        title: updatedTodo.title 
      });

      return updatedTodo;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Failed to update todo', { 
        error: error.message, 
        id, 
        updates 
      });
      throw new DatabaseError('Failed to update todo', error);
    }
  }

  /**
   * Delete todo by ID
   */
  async delete(id) {
    try {
      // First check if todo exists
      const existingTodo = await this.findById(id);
      if (!existingTodo) {
        throw new NotFoundError('Todo');
      }

      const query = 'DELETE FROM todos WHERE id = ?';
      const result = await this.db.run(query, [id]);

      if (result.changes === 0) {
        throw new NotFoundError('Todo');
      }

      logger.info('Deleted todo', { 
        id, 
        title: existingTodo.title 
      });

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('Failed to delete todo', { 
        error: error.message, 
        id 
      });
      throw new DatabaseError('Failed to delete todo', error);
    }
  }

 /**
   * Delete All todo
   */
  async deleteAll() {
    try {
      // Optional: Get count before deletion for logging
      const countQuery = 'SELECT COUNT(*) as count FROM todos';
      const countResult = await this.db.get(countQuery);
      const initialCount = countResult.count;

      if (initialCount === 0) {
        logger.info('No todos to delete');
        return { deletedCount: 0 };
      }

      const deleteQuery = 'DELETE FROM todos';
      const result = await this.db.run(deleteQuery);

      logger.info('Deleted all todos', { 
        deletedCount: result.changes,
        previousCount: initialCount
      });

      return { 
        success: true,
        deletedCount: result.changes,
        previousCount: initialCount
      };
    } catch (error) {
      logger.error('Failed to delete all todos', { 
        error: error.message 
      });
      throw new DatabaseError('Failed to delete all todos', error);
    }
}

  /**
   * Check if todo exists
   */
  async exists(id) {
    try {
      const query = 'SELECT EXISTS(SELECT 1 FROM todos WHERE id = ?) as exists';
      const result = await this.db.get(query, [id]);
      return Boolean(result.exists);
    } catch (error) {
      logger.error('Failed to check todo existence', { 
        error: error.message, 
        id 
      });
      throw new DatabaseError('Failed to check todo existence', error);
    }
  }

  /**
   * Get todo statistics
   */
  async getStats() {
    try {
      const queries = {
        total: 'SELECT COUNT(*) as count FROM todos',
        completed: 'SELECT COUNT(*) as count FROM todos WHERE completed = 1',
        pending: 'SELECT COUNT(*) as count FROM todos WHERE completed = 0',
      };

      const [total, completed, pending] = await Promise.all([
        this.db.get(queries.total),
        this.db.get(queries.completed),
        this.db.get(queries.pending),
      ]);

      const stats = {
        total_todos: total.count,
        completed_todos: completed.count,
        pending_todos: pending.count,
      };

      logger.debug('Retrieved todo statistics', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get todo statistics', { error: error.message });
      throw new DatabaseError('Failed to get todo statistics', error);
    }
  }

  /**
   * Bulk operations
   */
  async createMany(todosData) {
    try {
      const todos = [];
      for (const todoData of todosData) {
        const todo = await this.create(todoData);
        todos.push(todo);
      }
      return todos;
    } catch (error) {
      logger.error('Failed to create many todos', { 
        error: error.message, 
        count: todosData.length 
      });
      throw error;
    }
  }

  async deleteMany(ids) {
    try {
      const placeholders = ids.map(() => '?').join(', ');
      const query = `DELETE FROM todos WHERE id IN (${placeholders})`;
      const result = await this.db.run(query, ids);
      
      logger.info('Deleted multiple todos', { 
        requested: ids.length, 
        deleted: result.changes 
      });
      
      return result.changes;
    } catch (error) {
      logger.error('Failed to delete many todos', { 
        error: error.message, 
        ids 
      });
      throw new DatabaseError('Failed to delete todos', error);
    }
  }
}

export default TodoRepository;