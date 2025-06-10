package models

import (
	"time"
)

// Todo represents a todo item
type Todo struct {
	ID          int       `json:"id" db:"id"`
	Title       string    `json:"title" db:"title" validate:"required,min=1,max=255"`
	Description *string   `json:"description" db:"description" validate:"omitempty,max=1000"`
	Completed   bool      `json:"completed" db:"completed"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CreateTodoRequest represents the request to create a todo
type CreateTodoRequest struct {
	Title       string  `json:"title" validate:"required,min=1,max=255"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
	Completed   bool    `json:"completed"`
}

// UpdateTodoRequest represents the request to update a todo
type UpdateTodoRequest struct {
	Title       *string `json:"title,omitempty" validate:"omitempty,min=1,max=255"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=1000"`
	Completed   *bool   `json:"completed,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code,omitempty"`
	Details string `json:"details,omitempty"`
}

// SuccessResponse represents a success response
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// HealthResponse represents a health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
	Uptime    string    `json:"uptime"`
}

// PaginatedResponse represents a paginated response
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	TotalPages int         `json:"total_pages"`
}

// QueryParams represents common query parameters
type QueryParams struct {
	Page      int    `query:"page" validate:"min=1"`
	PerPage   int    `query:"per_page" validate:"min=1,max=100"`
	Sort      string `query:"sort" validate:"omitempty,oneof=created_at updated_at title"`
	Order     string `query:"order" validate:"omitempty,oneof=asc desc"`
	Search    string `query:"search" validate:"omitempty,max=255"`
	Completed *bool  `query:"completed"`
}

// DefaultQueryParams returns default query parameters
func DefaultQueryParams() QueryParams {
	return QueryParams{
		Page:    1,
		PerPage: 20,
		Sort:    "created_at",
		Order:   "desc",
	}
}