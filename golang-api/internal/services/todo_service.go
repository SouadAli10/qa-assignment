package services

import (
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/centroidsol/todo-api/internal/models"
	"github.com/centroidsol/todo-api/internal/repository"
)

type TodoService interface {
	GetTodos(params models.QueryParams) (*models.PaginatedResponse, error)
	GetTodoByID(id int) (*models.Todo, error)
	CreateTodo(req models.CreateTodoRequest) (*models.Todo, error)
	UpdateTodo(id int, req models.UpdateTodoRequest) (*models.Todo, error)
	DeleteTodo(id int) error
	DeleteAllTodos() error
	GetTodoStats() (map[string]interface{}, error)
}

type todoService struct {
	repo   repository.TodoRepository
	logger *slog.Logger
}

func NewTodoService(repo repository.TodoRepository, logger *slog.Logger) TodoService {
	return &todoService{
		repo:   repo,
		logger: logger,
	}
}

func (s *todoService) GetTodos(params models.QueryParams) (*models.PaginatedResponse, error) {
	s.logger.Info("Getting todos", "params", params)

	// Validate and set defaults
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PerPage < 1 || params.PerPage > 100 {
		params.PerPage = 20
	}
	if params.Sort == "" {
		params.Sort = "created_at"
	}
	if params.Order == "" {
		params.Order = "desc"
	}

	// Validate sort field
	validSortFields := []string{"id", "title", "completed", "created_at", "updated_at"}
	if !contains(validSortFields, params.Sort) {
		return nil, fmt.Errorf("invalid sort field: %s", params.Sort)
	}

	// Validate order
	if params.Order != "asc" && params.Order != "desc" {
		return nil, fmt.Errorf("invalid order: %s", params.Order)
	}

	todos, total, err := s.repo.GetAll(params)
	if err != nil {
		s.logger.Error("Failed to get todos", "error", err)
		return nil, fmt.Errorf("failed to get todos: %w", err)
	}

	totalPages := (total + params.PerPage - 1) / params.PerPage

	response := &models.PaginatedResponse{
		Data:       todos,
		Total:      total,
		Page:       params.Page,
		PerPage:    params.PerPage,
		TotalPages: totalPages,
	}

	s.logger.Info("Retrieved todos successfully", "count", len(todos), "total", total)
	return response, nil
}

func (s *todoService) GetTodoByID(id int) (*models.Todo, error) {
	s.logger.Info("Getting todo by ID", "id", id)

	if id <= 0 {
		return nil, fmt.Errorf("invalid todo ID: %d", id)
	}

	todo, err := s.repo.GetByID(id)
	if err != nil {
		s.logger.Error("Failed to get todo by ID", "id", id, "error", err)
		return nil, fmt.Errorf("failed to get todo: %w", err)
	}

	if todo == nil {
		s.logger.Warn("Todo not found", "id", id)
		return nil, nil
	}

	s.logger.Info("Retrieved todo successfully", "id", id, "title", todo.Title)
	return todo, nil
}

func (s *todoService) CreateTodo(req models.CreateTodoRequest) (*models.Todo, error) {
	s.logger.Info("Creating todo", "title", req.Title)

	// Validate request
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	// Create todo model
	todo := &models.Todo{
		Title:       strings.TrimSpace(req.Title),
		Description: req.Description,
		Completed:   req.Completed,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Trim description if provided
	if todo.Description != nil {
		trimmed := strings.TrimSpace(*todo.Description)
		if trimmed == "" {
			todo.Description = nil
		} else {
			todo.Description = &trimmed
		}
	}

	if err := s.repo.Create(todo); err != nil {
		s.logger.Error("Failed to create todo", "error", err)
		return nil, fmt.Errorf("failed to create todo: %w", err)
	}

	s.logger.Info("Created todo successfully", "id", todo.ID, "title", todo.Title)
	return todo, nil
}

func (s *todoService) UpdateTodo(id int, req models.UpdateTodoRequest) (*models.Todo, error) {
	s.logger.Info("Updating todo", "id", id)

	if id <= 0 {
		return nil, fmt.Errorf("invalid todo ID: %d", id)
	}

	// Validate request
	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	// Check if todo exists
	exists, err := s.repo.Exists(id)
	if err != nil {
		s.logger.Error("Failed to check todo existence", "id", id, "error", err)
		return nil, fmt.Errorf("failed to check todo existence: %w", err)
	}

	if !exists {
		s.logger.Warn("Todo not found for update", "id", id)
		return nil, nil
	}

	// Build updates map
	updates := make(map[string]interface{})

	if req.Title != nil {
		trimmed := strings.TrimSpace(*req.Title)
		updates["title"] = trimmed
	}

	if req.Description != nil {
		trimmed := strings.TrimSpace(*req.Description)
		if trimmed == "" {
			updates["description"] = nil
		} else {
			updates["description"] = trimmed
		}
	}

	if req.Completed != nil {
		updates["completed"] = *req.Completed
	}

	// Perform update
	todo, err := s.repo.Update(id, updates)
	if err != nil {
		s.logger.Error("Failed to update todo", "id", id, "error", err)
		return nil, fmt.Errorf("failed to update todo: %w", err)
	}

	s.logger.Info("Updated todo successfully", "id", id)
	return todo, nil
}

func (s *todoService) DeleteTodo(id int) error {
	s.logger.Info("Deleting todo", "id", id)

	if id <= 0 {
		return fmt.Errorf("invalid todo ID: %d", id)
	}

	// Check if todo exists
	exists, err := s.repo.Exists(id)
	if err != nil {
		s.logger.Error("Failed to check todo existence", "id", id, "error", err)
		return fmt.Errorf("failed to check todo existence: %w", err)
	}

	if !exists {
		s.logger.Warn("Todo not found for deletion", "id", id)
		return fmt.Errorf("todo with id %d not found", id)
	}

	if err := s.repo.Delete(id); err != nil {
		s.logger.Error("Failed to delete todo", "id", id, "error", err)
		return fmt.Errorf("failed to delete todo: %w", err)
	}

	s.logger.Info("Deleted todo successfully", "id", id)
	return nil
}

func (s *todoService) DeleteAllTodos() error {
	s.logger.Info("Deleting all todos")

	if err := s.repo.DeleteAll(); err != nil {
		s.logger.Error("Failed to delete all todos", "error", err)
		return fmt.Errorf("failed to delete all todos: %w", err)
	}

	s.logger.Info("Deleted all todos successfully")
	return nil
}

func (s *todoService) GetTodoStats() (map[string]interface{}, error) {
	s.logger.Info("Getting todo statistics")

	// Get all todos to calculate stats
	params := models.QueryParams{
		Page:    1,
		PerPage: 1000, // Get a large number to get all todos
		Sort:    "created_at",
		Order:   "desc",
	}

	response, err := s.GetTodos(params)
	if err != nil {
		return nil, err
	}

	todos := response.Data.([]models.Todo)

	stats := map[string]interface{}{
		"total_todos":     response.Total,
		"completed_todos": 0,
		"pending_todos":   0,
	}

	for _, todo := range todos {
		if todo.Completed {
			stats["completed_todos"] = stats["completed_todos"].(int) + 1
		} else {
			stats["pending_todos"] = stats["pending_todos"].(int) + 1
		}
	}

	s.logger.Info("Retrieved todo statistics", "stats", stats)
	return stats, nil
}

func (s *todoService) validateCreateRequest(req models.CreateTodoRequest) error {
	if strings.TrimSpace(req.Title) == "" {
		return fmt.Errorf("title is required")
	}

	if len(req.Title) > 255 {
		return fmt.Errorf("title cannot exceed 255 characters")
	}

	if req.Description != nil && len(*req.Description) > 1000 {
		return fmt.Errorf("description cannot exceed 1000 characters")
	}

	return nil
}

func (s *todoService) validateUpdateRequest(req models.UpdateTodoRequest) error {
	if req.Title != nil {
		if strings.TrimSpace(*req.Title) == "" {
			return fmt.Errorf("title cannot be empty")
		}
		if len(*req.Title) > 255 {
			return fmt.Errorf("title cannot exceed 255 characters")
		}
	}

	if req.Description != nil && len(*req.Description) > 1000 {
		return fmt.Errorf("description cannot exceed 1000 characters")
	}

	return nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
