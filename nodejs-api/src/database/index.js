import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { config, isTest } from '../config/index.js';
import { logger } from '../utils/logger.js';

class Database {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const dbPath = isTest() ? config.database.testPath : config.database.path;
      
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Configure database settings
      await this.db.exec('PRAGMA foreign_keys = ON');
      await this.db.exec('PRAGMA journal_mode = WAL');
      await this.db.exec('PRAGMA synchronous = NORMAL');
      await this.db.exec('PRAGMA cache_size = 1000');
      await this.db.exec('PRAGMA temp_store = MEMORY');

      await this.migrate();
      this.isConnected = true;
      
      logger.info('Database connected successfully', { path: dbPath });
      return this.db;
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      throw error;
    }
  }

  async migrate() {
    const migrations = [
      `CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)`,
      `CREATE INDEX IF NOT EXISTS idx_todos_title ON todos(title)`,
      `CREATE TRIGGER IF NOT EXISTS update_todos_updated_at
       AFTER UPDATE ON todos
       FOR EACH ROW
       BEGIN
         UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
    ];

    for (const migration of migrations) {
      await this.db.exec(migration);
    }

    logger.info('Database migrations completed');
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }

  async clear() {
    if (this.db) {
      await this.db.exec('DELETE FROM todos');
      logger.info('Database cleared');
    }
  }

  async healthCheck() {
    try {
      await this.db.get('SELECT 1');
      return { status: 'healthy', connected: this.isConnected };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async getStats() {
    try {
      const todoCount = await this.db.get('SELECT COUNT(*) as count FROM todos');
      const completedCount = await this.db.get('SELECT COUNT(*) as count FROM todos WHERE completed = 1');
      const pendingCount = await this.db.get('SELECT COUNT(*) as count FROM todos WHERE completed = 0');

      return {
        total_todos: todoCount.count,
        completed_todos: completedCount.count,
        pending_todos: pendingCount.count,
        connected: this.isConnected,
      };
    } catch (error) {
      logger.error('Failed to get database stats', { error: error.message });
      throw error;
    }
  }

  getDb() {
    if (!this.db || !this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.db;
  }
}

// Singleton instance
export const database = new Database();

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Shutting down database connection...');
  await database.close();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default database;