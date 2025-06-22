package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/centroidsol/todo-api/internal/models"
)

type TodoRepository interface {
	GetAll(params models.QueryParams) ([]models.Todo, int, error)
	GetByID(id int) (*models.Todo, error)
	Create(todo *models.Todo) error
	Update(id int, updates map[string]interface{}) (*models.Todo, error)
	Delete(id int) error
	DeleteAll() error
	Exists(id int) (bool, error)
}

type todoRepository struct {
	db *sql.DB
}

func NewTodoRepository(db *sql.DB) TodoRepository {
	return &todoRepository{db: db}
}

func (r *todoRepository) GetAll(params models.QueryParams) ([]models.Todo, int, error) {
	// Build query with filters
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if params.Search != "" {
		whereClause += fmt.Sprintf(" AND (title LIKE $%d OR description LIKE $%d)", argIndex, argIndex+1)
		searchTerm := "%" + params.Search + "%"
		args = append(args, searchTerm, searchTerm)
		argIndex += 2
	}

	if params.Completed != nil {
		whereClause += fmt.Sprintf(" AND completed = $%d", argIndex)
		args = append(args, *params.Completed)
		argIndex++
	}

	// Count total records
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM todos %s", whereClause)
	var total int
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count todos: %w", err)
	}

	// Build main query with pagination and sorting
	orderClause := fmt.Sprintf("ORDER BY %s %s", params.Sort, strings.ToUpper(params.Order))
	offset := (params.Page - 1) * params.PerPage
	limitClause := fmt.Sprintf("LIMIT %d OFFSET %d", params.PerPage, offset)

	query := fmt.Sprintf(`
		SELECT id, title, description, completed, created_at, updated_at 
		FROM todos %s %s %s
	`, whereClause, orderClause, limitClause)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query todos: %w", err)
	}
	defer rows.Close()

	todos := make([]models.Todo, 0)
	for rows.Next() {
		var todo models.Todo
		err := rows.Scan(
			&todo.ID,
			&todo.Title,
			&todo.Description,
			&todo.Completed,
			&todo.CreatedAt,
			&todo.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan todo: %w", err)
		}
		todos = append(todos, todo)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("row iteration error: %w", err)
	}

	return todos, total, nil
}

func (r *todoRepository) GetByID(id int) (*models.Todo, error) {
	query := `
		SELECT id, title, description, completed, created_at, updated_at 
		FROM todos WHERE id = ?
	`

	var todo models.Todo
	err := r.db.QueryRow(query, id).Scan(
		&todo.ID,
		&todo.Title,
		&todo.Description,
		&todo.Completed,
		&todo.CreatedAt,
		&todo.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get todo by id: %w", err)
	}

	return &todo, nil
}

func (r *todoRepository) Create(todo *models.Todo) error {
	query := `
		INSERT INTO todos (title, description, completed) 
		VALUES (?, ?, ?)
	`

	result, err := r.db.Exec(query, todo.Title, todo.Description, todo.Completed)
	if err != nil {
		return fmt.Errorf("failed to create todo: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert id: %w", err)
	}

	// Fetch the created todo to get timestamps
	createdTodo, err := r.GetByID(int(id))
	if err != nil {
		return fmt.Errorf("failed to fetch created todo: %w", err)
	}

	*todo = *createdTodo
	return nil
}

func (r *todoRepository) Update(id int, updates map[string]interface{}) (*models.Todo, error) {
	if len(updates) == 0 {
		return r.GetByID(id)
	}

	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}

	for field, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s = ?", field))
		args = append(args, value)
	}

	// Add updated_at
	setParts = append(setParts, "updated_at = CURRENT_TIMESTAMP")

	// Add id for WHERE clause
	args = append(args, id)

	query := fmt.Sprintf(
		"UPDATE todos SET %s WHERE id = ?",
		strings.Join(setParts, ", "),
	)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update todo: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return nil, nil // Todo not found
	}

	return r.GetByID(id)
}

func (r *todoRepository) Delete(id int) error {
	query := "DELETE FROM todos WHERE id = ?"

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete todo: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("todo with id %d not found", id)
	}

	return nil
}

func (r *todoRepository) DeleteAll() error {
	query := "DELETE FROM todos" // No WHERE clause means delete all rows

	result, err := r.db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to delete all todos: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	// Optional: Log how many rows were deleted
	// You could also skip this check if you don't need to know
	if rowsAffected == 0 {
		return fmt.Errorf("no todos found to delete")
	}

	return nil
}

func (r *todoRepository) Exists(id int) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM todos WHERE id = ?)"

	var exists bool
	err := r.db.QueryRow(query, id).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check todo existence: %w", err)
	}

	return exists, nil
}
