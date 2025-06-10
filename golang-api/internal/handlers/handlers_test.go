package handlers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/centroidsol/todo-api/internal/config"
	"github.com/centroidsol/todo-api/internal/database"
	"github.com/centroidsol/todo-api/internal/handlers"
	"github.com/centroidsol/todo-api/internal/models"
	"github.com/centroidsol/todo-api/internal/repository"
	"github.com/centroidsol/todo-api/internal/routes"
	"github.com/centroidsol/todo-api/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type HandlersTestSuite struct {
	suite.Suite
	app    *fiber.App
	db     *database.Database
	logger *slog.Logger
}

func (suite *HandlersTestSuite) SetupSuite() {
	// Set test environment
	os.Setenv("ENVIRONMENT", "test")

	// Setup test configuration
	cfg := &config.Config{
		App: config.AppConfig{
			Environment: "test",
			Name:        "Todo API Test",
			Version:     "1.0.0",
		},
		Database: config.DatabaseConfig{
			Path: ":memory:",
		},
		Server: config.ServerConfig{
			Host: "localhost",
			Port: "3001",
		},
	}

	// Setup logger
	suite.logger = slog.New(slog.NewTextHandler(io.Discard, nil))

	// Setup database
	var err error
	suite.db, err = database.New(cfg)
	assert.NoError(suite.T(), err)

	// Setup Fiber app
	suite.app = fiber.New(fiber.Config{
		Testing: true,
	})

	// Setup routes
	routes.Setup(suite.app, suite.db, cfg, suite.logger)
}

func (suite *HandlersTestSuite) SetupTest() {
	// Clear database before each test
	err := suite.db.Clear()
	assert.NoError(suite.T(), err)
}

func (suite *HandlersTestSuite) TearDownSuite() {
	suite.db.Close()
}

func (suite *HandlersTestSuite) TestHealthEndpoint() {
	req := httptest.NewRequest("GET", "/health", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var healthResp models.HealthResponse
	err = json.Unmarshal(body, &healthResp)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "ok", healthResp.Status)
}

func (suite *HandlersTestSuite) TestGetTodos_Empty() {
	req := httptest.NewRequest("GET", "/api/todos", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var response models.PaginatedResponse
	err = json.Unmarshal(body, &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 0, response.Total)
	assert.Equal(suite.T(), 1, response.Page)
}

func (suite *HandlersTestSuite) TestCreateTodo() {
	todoReq := models.CreateTodoRequest{
		Title:       "Test Todo",
		Description: stringPtr("Test Description"),
		Completed:   false,
	}

	jsonBody, err := json.Marshal(todoReq)
	assert.NoError(suite.T(), err)

	req := httptest.NewRequest("POST", "/api/todos", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 201, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var createdTodo models.Todo
	err = json.Unmarshal(body, &createdTodo)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), todoReq.Title, createdTodo.Title)
	assert.Equal(suite.T(), *todoReq.Description, *createdTodo.Description)
	assert.Equal(suite.T(), todoReq.Completed, createdTodo.Completed)
	assert.NotZero(suite.T(), createdTodo.ID)
}

func (suite *HandlersTestSuite) TestCreateTodo_InvalidRequest() {
	// Test with empty title
	todoReq := models.CreateTodoRequest{
		Title: "",
	}

	jsonBody, err := json.Marshal(todoReq)
	assert.NoError(suite.T(), err)

	req := httptest.NewRequest("POST", "/api/todos", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 400, resp.StatusCode)
}

func (suite *HandlersTestSuite) TestGetTodo() {
	// Create a todo first
	todo := suite.createTestTodo("Test Todo", "Test Description")

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/todos/%d", todo.ID), nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var fetchedTodo models.Todo
	err = json.Unmarshal(body, &fetchedTodo)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), todo.ID, fetchedTodo.ID)
	assert.Equal(suite.T(), todo.Title, fetchedTodo.Title)
}

func (suite *HandlersTestSuite) TestGetTodo_NotFound() {
	req := httptest.NewRequest("GET", "/api/todos/999", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 404, resp.StatusCode)
}

func (suite *HandlersTestSuite) TestUpdateTodo() {
	// Create a todo first
	todo := suite.createTestTodo("Original Title", "Original Description")

	updateReq := models.UpdateTodoRequest{
		Title:     stringPtr("Updated Title"),
		Completed: boolPtr(true),
	}

	jsonBody, err := json.Marshal(updateReq)
	assert.NoError(suite.T(), err)

	req := httptest.NewRequest("PUT", fmt.Sprintf("/api/todos/%d", todo.ID), bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var updatedTodo models.Todo
	err = json.Unmarshal(body, &updatedTodo)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Updated Title", updatedTodo.Title)
	assert.Equal(suite.T(), true, updatedTodo.Completed)
}

func (suite *HandlersTestSuite) TestUpdateTodo_NotFound() {
	updateReq := models.UpdateTodoRequest{
		Title: stringPtr("Updated Title"),
	}

	jsonBody, err := json.Marshal(updateReq)
	assert.NoError(suite.T(), err)

	req := httptest.NewRequest("PUT", "/api/todos/999", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 404, resp.StatusCode)
}

func (suite *HandlersTestSuite) TestDeleteTodo() {
	// Create a todo first
	todo := suite.createTestTodo("To Delete", "Delete Description")

	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/todos/%d", todo.ID), nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 204, resp.StatusCode)

	// Verify it's deleted
	req = httptest.NewRequest("GET", fmt.Sprintf("/api/todos/%d", todo.ID), nil)
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 404, resp.StatusCode)
}

func (suite *HandlersTestSuite) TestDeleteTodo_NotFound() {
	req := httptest.NewRequest("DELETE", "/api/todos/999", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 404, resp.StatusCode)
}

func (suite *HandlersTestSuite) TestGetTodosWithPagination() {
	// Create multiple todos
	for i := 1; i <= 5; i++ {
		suite.createTestTodo(fmt.Sprintf("Todo %d", i), fmt.Sprintf("Description %d", i))
	}

	req := httptest.NewRequest("GET", "/api/todos?page=1&per_page=3", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var response models.PaginatedResponse
	err = json.Unmarshal(body, &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5, response.Total)
	assert.Equal(suite.T(), 1, response.Page)
	assert.Equal(suite.T(), 3, response.PerPage)
	assert.Equal(suite.T(), 2, response.TotalPages)

	todos := response.Data.([]interface{})
	assert.Len(suite.T(), todos, 3)
}

func (suite *HandlersTestSuite) TestGetTodoStats() {
	// Create some todos
	suite.createTestTodo("Todo 1", "Description 1")
	todo2 := suite.createTestTodo("Todo 2", "Description 2")
	
	// Mark one as completed
	updateReq := models.UpdateTodoRequest{
		Completed: boolPtr(true),
	}
	jsonBody, _ := json.Marshal(updateReq)
	req := httptest.NewRequest("PUT", fmt.Sprintf("/api/todos/%d", todo2.ID), bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	suite.app.Test(req)

	// Get stats
	req = httptest.NewRequest("GET", "/api/todos/stats", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var stats map[string]interface{}
	err = json.Unmarshal(body, &stats)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), float64(2), stats["total_todos"])
	assert.Equal(suite.T(), float64(1), stats["completed_todos"])
	assert.Equal(suite.T(), float64(1), stats["pending_todos"])
}

// Helper functions
func (suite *HandlersTestSuite) createTestTodo(title, description string) *models.Todo {
	todoReq := models.CreateTodoRequest{
		Title:       title,
		Description: &description,
		Completed:   false,
	}

	jsonBody, _ := json.Marshal(todoReq)
	req := httptest.NewRequest("POST", "/api/todos", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	resp, _ := suite.app.Test(req)
	body, _ := io.ReadAll(resp.Body)

	var todo models.Todo
	json.Unmarshal(body, &todo)
	return &todo
}

func stringPtr(s string) *string {
	return &s
}

func boolPtr(b bool) *bool {
	return &b
}

func TestHandlersTestSuite(t *testing.T) {
	suite.Run(t, new(HandlersTestSuite))
}