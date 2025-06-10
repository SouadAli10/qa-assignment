package handlers

import (
	"log/slog"
	"strconv"

	"github.com/centroidsol/todo-api/internal/models"
	"github.com/centroidsol/todo-api/internal/services"
	"github.com/gofiber/fiber/v2"
)

type TodoHandler struct {
	service services.TodoService
	logger  *slog.Logger
}

func NewTodoHandler(service services.TodoService, logger *slog.Logger) *TodoHandler {
	return &TodoHandler{
		service: service,
		logger:  logger,
	}
}

// GetTodos godoc
// @Summary Get all todos
// @Description Get all todos with optional filtering, sorting, and pagination
// @Tags todos
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param per_page query int false "Items per page" default(20)
// @Param sort query string false "Sort field" Enums(id,title,completed,created_at,updated_at) default(created_at)
// @Param order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param search query string false "Search in title and description"
// @Param completed query bool false "Filter by completion status"
// @Success 200 {object} models.PaginatedResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /todos [get]
func (h *TodoHandler) GetTodos(c *fiber.Ctx) error {
	// Parse query parameters
	params := models.DefaultQueryParams()
	
	if page := c.QueryInt("page", 1); page > 0 {
		params.Page = page
	}
	
	if perPage := c.QueryInt("per_page", 20); perPage > 0 && perPage <= 100 {
		params.PerPage = perPage
	}
	
	if sort := c.Query("sort"); sort != "" {
		params.Sort = sort
	}
	
	if order := c.Query("order"); order != "" {
		params.Order = order
	}
	
	if search := c.Query("search"); search != "" {
		params.Search = search
	}
	
	if completedStr := c.Query("completed"); completedStr != "" {
		if completed, err := strconv.ParseBool(completedStr); err == nil {
			params.Completed = &completed
		}
	}

	response, err := h.service.GetTodos(params)
	if err != nil {
		h.logger.Error("Failed to get todos", "error", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: err.Error(),
			Code:  fiber.StatusBadRequest,
		})
	}

	return c.JSON(response)
}

// GetTodo godoc
// @Summary Get a todo by ID
// @Description Get a single todo by its ID
// @Tags todos
// @Accept json
// @Produce json
// @Param id path int true "Todo ID"
// @Success 200 {object} models.Todo
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /todos/{id} [get]
func (h *TodoHandler) GetTodo(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "Invalid todo ID",
			Code:  fiber.StatusBadRequest,
		})
	}

	todo, err := h.service.GetTodoByID(id)
	if err != nil {
		h.logger.Error("Failed to get todo", "id", id, "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{
			Error: "Failed to get todo",
			Code:  fiber.StatusInternalServerError,
		})
	}

	if todo == nil {
		return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{
			Error: "Todo not found",
			Code:  fiber.StatusNotFound,
		})
	}

	return c.JSON(todo)
}

// CreateTodo godoc
// @Summary Create a new todo
// @Description Create a new todo item
// @Tags todos
// @Accept json
// @Produce json
// @Param todo body models.CreateTodoRequest true "Todo data"
// @Success 201 {object} models.Todo
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /todos [post]
func (h *TodoHandler) CreateTodo(c *fiber.Ctx) error {
	var req models.CreateTodoRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "Invalid request body",
			Code:  fiber.StatusBadRequest,
		})
	}

	todo, err := h.service.CreateTodo(req)
	if err != nil {
		h.logger.Error("Failed to create todo", "error", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: err.Error(),
			Code:  fiber.StatusBadRequest,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(todo)
}

// UpdateTodo godoc
// @Summary Update a todo
// @Description Update an existing todo item
// @Tags todos
// @Accept json
// @Produce json
// @Param id path int true "Todo ID"
// @Param todo body models.UpdateTodoRequest true "Todo update data"
// @Success 200 {object} models.Todo
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /todos/{id} [put]
func (h *TodoHandler) UpdateTodo(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "Invalid todo ID",
			Code:  fiber.StatusBadRequest,
		})
	}

	var req models.UpdateTodoRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "Invalid request body",
			Code:  fiber.StatusBadRequest,
		})
	}

	todo, err := h.service.UpdateTodo(id, req)
	if err != nil {
		h.logger.Error("Failed to update todo", "id", id, "error", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: err.Error(),
			Code:  fiber.StatusBadRequest,
		})
	}

	if todo == nil {
		return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{
			Error: "Todo not found",
			Code:  fiber.StatusNotFound,
		})
	}

	return c.JSON(todo)
}

// DeleteTodo godoc
// @Summary Delete a todo
// @Description Delete a todo item
// @Tags todos
// @Accept json
// @Produce json
// @Param id path int true "Todo ID"
// @Success 204
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /todos/{id} [delete]
func (h *TodoHandler) DeleteTodo(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Error: "Invalid todo ID",
			Code:  fiber.StatusBadRequest,
		})
	}

	if err := h.service.DeleteTodo(id); err != nil {
		h.logger.Error("Failed to delete todo", "id", id, "error", err)
		
		// Check if it's a not found error
		if err.Error() == "todo with id "+strconv.Itoa(id)+" not found" {
			return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{
				Error: err.Error(),
				Code:  fiber.StatusNotFound,
			})
		}
		
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{
			Error: "Failed to delete todo",
			Code:  fiber.StatusInternalServerError,
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// GetTodoStats godoc
// @Summary Get todo statistics
// @Description Get statistics about todos (total, completed, pending)
// @Tags todos
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} models.ErrorResponse
// @Router /todos/stats [get]
func (h *TodoHandler) GetTodoStats(c *fiber.Ctx) error {
	stats, err := h.service.GetTodoStats()
	if err != nil {
		h.logger.Error("Failed to get todo stats", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{
			Error: "Failed to get statistics",
			Code:  fiber.StatusInternalServerError,
		})
	}

	return c.JSON(stats)
}