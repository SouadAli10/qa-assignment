package database

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/centroidsol/todo-api/internal/config"
	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	db *sql.DB
}

func New(cfg *config.Config) (*Database, error) {
	var dbPath string
	if cfg.IsTest() {
		dbPath = ":memory:"
	} else {
		dbPath = cfg.Database.Path
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)

	database := &Database{db: db}

	if err := database.migrate(); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Printf("Database connected successfully: %s", dbPath)
	return database, nil
}

func (d *Database) Close() error {
	if d.db != nil {
		return d.db.Close()
	}
	return nil
}

func (d *Database) DB() *sql.DB {
	return d.db
}

func (d *Database) Ping() error {
	return d.db.Ping()
}

func (d *Database) migrate() error {
	query := `
	CREATE TABLE IF NOT EXISTS todos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT,
		completed BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
	CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
	CREATE INDEX IF NOT EXISTS idx_todos_title ON todos(title);

	-- Trigger to update updated_at timestamp
	CREATE TRIGGER IF NOT EXISTS update_todos_updated_at
	AFTER UPDATE ON todos
	FOR EACH ROW
	BEGIN
		UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
	END;
	`

	if _, err := d.db.Exec(query); err != nil {
		return fmt.Errorf("failed to execute migration: %w", err)
	}

	return nil
}

func (d *Database) Clear() error {
	_, err := d.db.Exec("DELETE FROM todos")
	return err
}

func (d *Database) Stats() (map[string]interface{}, error) {
	stats := d.db.Stats()
	
	var todoCount int
	err := d.db.QueryRow("SELECT COUNT(*) FROM todos").Scan(&todoCount)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"open_connections":      stats.OpenConnections,
		"in_use":               stats.InUse,
		"idle":                 stats.Idle,
		"wait_count":           stats.WaitCount,
		"wait_duration":        stats.WaitDuration,
		"max_idle_closed":      stats.MaxIdleClosed,
		"max_idle_time_closed": stats.MaxIdleTimeClosed,
		"max_lifetime_closed":  stats.MaxLifetimeClosed,
		"todo_count":           todoCount,
	}, nil
}