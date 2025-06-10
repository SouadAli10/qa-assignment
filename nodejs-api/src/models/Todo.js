/**
 * Todo model representing a todo item
 */
export class Todo {
  constructor({
    id,
    title,
    description = null,
    completed = false,
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = Boolean(completed);
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Create Todo instance from database row
   */
  static fromDb(row) {
    return new Todo({
      id: row.id,
      title: row.title,
      description: row.description,
      completed: Boolean(row.completed),
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Convert to database format
   */
  toDb() {
    return {
      title: this.title,
      description: this.description,
      completed: this.completed ? 1 : 0,
    };
  }

  /**
   * Check if todo is valid
   */
  isValid() {
    return (
      typeof this.title === 'string' &&
      this.title.trim().length > 0 &&
      this.title.length <= 255 &&
      (this.description === null || 
       (typeof this.description === 'string' && this.description.length <= 1000)) &&
      typeof this.completed === 'boolean'
    );
  }

  /**
   * Get validation errors
   */
  getValidationErrors() {
    const errors = [];

    if (!this.title || typeof this.title !== 'string' || this.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (this.title.length > 255) {
      errors.push('Title cannot exceed 255 characters');
    }

    if (this.description !== null && 
        (typeof this.description !== 'string' || this.description.length > 1000)) {
      errors.push('Description cannot exceed 1000 characters');
    }

    if (typeof this.completed !== 'boolean') {
      errors.push('Completed must be a boolean');
    }

    return errors;
  }

  /**
   * Update todo properties
   */
  update(updates) {
    const allowedUpdates = ['title', 'description', 'completed'];
    const updatedTodo = new Todo(this);

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updatedTodo[key] = value;
      }
    }

    return updatedTodo;
  }

  /**
   * Check if todo is completed
   */
  isCompleted() {
    return this.completed === true;
  }

  /**
   * Mark todo as completed
   */
  markCompleted() {
    return this.update({ completed: true });
  }

  /**
   * Mark todo as pending
   */
  markPending() {
    return this.update({ completed: false });
  }

  /**
   * Get todo age in days
   */
  getAge() {
    if (!this.created_at) return 0;
    const created = new Date(this.created_at);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }

  /**
   * Create a summary of the todo
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title.length > 50 ? this.title.substring(0, 47) + '...' : this.title,
      completed: this.completed,
      age_days: this.getAge(),
    };
  }
}

export default Todo;