package services

import (
	"errors"
	"log/slog"
	"testing"

	"github.com/centroidsol/todo-api/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockTodoRepository struct {
	mock.Mock
}

func (m *MockTodoRepository) GetAll(params models.QueryParams) ([]models.Todo, int, error) {
	args := m.Called(params)
	return args.Get(0).([]models.Todo), args.Get(1).(int), args.Error(2) // Changed int64 to int
}

func (m *MockTodoRepository) GetByID(id int) (*models.Todo, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Todo), args.Error(1)
}

func (m *MockTodoRepository) Create(todo *models.Todo) error {
	args := m.Called(todo)
	return args.Error(0)
}

func (m *MockTodoRepository) Update(id int, updates map[string]interface{}) (*models.Todo, error) {
	args := m.Called(id, updates)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Todo), args.Error(1)
}

func (m *MockTodoRepository) Exists(id int) (bool, error) {
	args := m.Called(id)
	return args.Bool(0), args.Error(1)
}

func (m *MockTodoRepository) Delete(id int) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockTodoRepository) DeleteAll() error {
	args := m.Called()
	return args.Error(0)
}

func TestNewTodoService(t *testing.T) {
	mockRepo := new(MockTodoRepository)
	logger := slog.Default()

	service := NewTodoService(mockRepo, logger)

	assert.NotNil(t, service)
}

func TestTodoService_GetTodos(t *testing.T) {
	tests := []struct {
		name          string
		params        models.QueryParams
		mockSetup     func(*MockTodoRepository)
		expected      *models.PaginatedResponse
		expectedError string
	}{
		{
			name: "success with default params",
			params: models.QueryParams{
				Page:    0,
				PerPage: 0,
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetAll", models.QueryParams{
					Page:    1,
					PerPage: 20,
					Sort:    "created_at",
					Order:   "desc",
				}).Return([]models.Todo{
					{ID: 1, Title: "Test Todo"},
				}, 1, nil)
			},
			expected: &models.PaginatedResponse{
				Data:       []models.Todo{{ID: 1, Title: "Test Todo"}},
				Total:      1,
				Page:       1,
				PerPage:    20,
				TotalPages: 1,
			},
		},
		{
			name: "success with custom params",
			params: models.QueryParams{
				Page:    2,
				PerPage: 10,
				Sort:    "title",
				Order:   "asc",
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetAll", models.QueryParams{
					Page:    2,
					PerPage: 10,
					Sort:    "title",
					Order:   "asc",
				}).Return([]models.Todo{
					{ID: 1, Title: "A Todo"},
					{ID: 2, Title: "B Todo"},
				}, 20, nil)
			},
			expected: &models.PaginatedResponse{
				Data:       []models.Todo{{ID: 1, Title: "A Todo"}, {ID: 2, Title: "B Todo"}},
				Total:      20,
				Page:       2,
				PerPage:    10,
				TotalPages: 2,
			},
		},
		{
			name: "invalid sort field",
			params: models.QueryParams{
				Sort: "invalid_field",
			},
			expectedError: "invalid sort field: invalid_field",
		},
		{
			name: "invalid order",
			params: models.QueryParams{
				Order: "invalid_order",
			},
			expectedError: "invalid order: invalid_order",
		},
		{
			name: "repository error",
			params: models.QueryParams{
				Page:    1,
				PerPage: 20,
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetAll", mock.Anything).Return([]models.Todo{}, 0, errors.New("db error"))
			},
			expectedError: "failed to get todos: db error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(MockTodoRepository)
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTodoService(mockRepo, slog.Default())

			result, err := service.GetTodos(tt.params)

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestTodoService_GetTodoByID(t *testing.T) {
	tests := []struct {
		name          string
		id            int
		mockSetup     func(*MockTodoRepository)
		expected      *models.Todo
		expectedError string
	}{
		{
			name: "success",
			id:   1,
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetByID", 1).Return(&models.Todo{ID: 1, Title: "Test Todo"}, nil)
			},
			expected: &models.Todo{ID: 1, Title: "Test Todo"},
		},
		{
			name: "not found",
			id:   999,
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetByID", 999).Return(nil, nil)
			},
			expected: nil,
		},
		{
			name:          "invalid id",
			id:            0,
			expectedError: "invalid todo ID: 0",
		},
		{
			name: "repository error",
			id:   1,
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetByID", 1).Return(nil, errors.New("db error"))
			},
			expectedError: "failed to get todo: db error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(MockTodoRepository)
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTodoService(mockRepo, slog.Default())

			result, err := service.GetTodoByID(tt.id)

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestTodoService_CreateTodo(t *testing.T) {
	tests := []struct {
		name          string
		req           models.CreateTodoRequest
		mockSetup     func(*MockTodoRepository)
		expected      *models.Todo
		expectedError string
	}{
		{
			name: "success with required fields",
			req: models.CreateTodoRequest{
				Title: "Test Todo",
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Create", mock.MatchedBy(func(todo *models.Todo) bool {
					return todo.Title == "Test Todo" && todo.Description == nil && !todo.Completed
				})).Return(nil)
			},
			expected: &models.Todo{
				Title:     "Test Todo",
				Completed: false,
			},
		},
		{
			name: "success with all fields",
			req: models.CreateTodoRequest{
				Title:       "Test Todo",
				Description: strPtr("Test Description"),
				Completed:   true,
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Create", mock.MatchedBy(func(todo *models.Todo) bool {
					return todo.Title == "Test Todo" && *todo.Description == "Test Description" && todo.Completed
				})).Return(nil)
			},
			expected: &models.Todo{
				Title:       "Test Todo",
				Description: strPtr("Test Description"),
				Completed:   true,
			},
		},
		{
			name: "empty title",
			req: models.CreateTodoRequest{
				Title: "   ",
			},
			expectedError: "title is required",
		},
		{
			name: "title too long",
			req: models.CreateTodoRequest{
				Title: string(make([]byte, 256)),
			},
			expectedError: "title cannot exceed 255 characters",
		},
		{
			name: "description too long",
			req: models.CreateTodoRequest{
				Title:       "Test",
				Description: strPtr(string(make([]byte, 1001))),
			},
			expectedError: "description cannot exceed 1000 characters",
		},
		{
			name: "repository error",
			req: models.CreateTodoRequest{
				Title: "Test Todo",
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Create", mock.Anything).Return(errors.New("db error"))
			},
			expectedError: "failed to create todo: db error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(MockTodoRepository)
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTodoService(mockRepo, slog.Default())

			result, err := service.CreateTodo(tt.req)

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected.Title, result.Title)
				assert.Equal(t, tt.expected.Description, result.Description)
				assert.Equal(t, tt.expected.Completed, result.Completed)
				assert.NotZero(t, result.CreatedAt)
				assert.NotZero(t, result.UpdatedAt)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestTodoService_UpdateTodo(t *testing.T) {
	tests := []struct {
		name          string
		id            int
		req           models.UpdateTodoRequest
		mockSetup     func(*MockTodoRepository)
		expected      *models.Todo
		expectedError string
	}{
		{
			name: "success update title",
			id:   1,
			req: models.UpdateTodoRequest{
				Title: strPtr("Updated Title"),
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(true, nil)
				m.On("Update", 1, map[string]interface{}{
					"title": "Updated Title",
				}).Return(&models.Todo{
					ID:    1,
					Title: "Updated Title",
				}, nil)
			},
			expected: &models.Todo{
				ID:    1,
				Title: "Updated Title",
			},
		},
		{
			name: "success update description",
			id:   1,
			req: models.UpdateTodoRequest{
				Description: strPtr("Updated Description"),
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(true, nil)
				m.On("Update", 1, map[string]interface{}{
					"description": "Updated Description",
				}).Return(&models.Todo{
					ID:          1,
					Description: strPtr("Updated Description"),
				}, nil)
			},
			expected: &models.Todo{
				ID:          1,
				Description: strPtr("Updated Description"),
			},
		},
		{
			name: "success update completed",
			id:   1,
			req: models.UpdateTodoRequest{
				Completed: boolPtr(true),
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(true, nil)
				m.On("Update", 1, map[string]interface{}{
					"completed": true,
				}).Return(&models.Todo{
					ID:        1,
					Completed: true,
				}, nil)
			},
			expected: &models.Todo{
				ID:        1,
				Completed: true,
			},
		},
		{
			name: "success update all fields",
			id:   1,
			req: models.UpdateTodoRequest{
				Title:       strPtr("Updated Title"),
				Description: strPtr("Updated Description"),
				Completed:   boolPtr(true),
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(true, nil)
				m.On("Update", 1, map[string]interface{}{
					"title":       "Updated Title",
					"description": "Updated Description",
					"completed":   true,
				}).Return(&models.Todo{
					ID:          1,
					Title:       "Updated Title",
					Description: strPtr("Updated Description"),
					Completed:   true,
				}, nil)
			},
			expected: &models.Todo{
				ID:          1,
				Title:       "Updated Title",
				Description: strPtr("Updated Description"),
				Completed:   true,
			},
		},
		{
			name: "empty title",
			id:   1,
			req: models.UpdateTodoRequest{
				Title: strPtr("   "),
			},
			expectedError: "title cannot be empty",
		},
		{
			name: "title too long",
			id:   1,
			req: models.UpdateTodoRequest{
				Title: strPtr(string(make([]byte, 256))),
			},
			expectedError: "title cannot exceed 255 characters",
		},
		{
			name: "description too long",
			id:   1,
			req: models.UpdateTodoRequest{
				Description: strPtr(string(make([]byte, 1001))),
			},
			expectedError: "description cannot exceed 1000 characters",
		},
		{
			name: "todo not found",
			id:   999,
			req: models.UpdateTodoRequest{
				Title: strPtr("Updated"),
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 999).Return(false, nil)
			},
			expected: nil,
		},
		{
			name:          "invalid id",
			id:            0,
			req:           models.UpdateTodoRequest{},
			expectedError: "invalid todo ID: 0",
		},
		{
			name: "exists check error",
			id:   1,
			req:  models.UpdateTodoRequest{},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(false, errors.New("db error"))
			},
			expectedError: "failed to check todo existence: db error",
		},
		{
			name: "update error",
			id:   1,
			req: models.UpdateTodoRequest{
				Title: strPtr("Updated"),
			},
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(true, nil)
				m.On("Update", 1, mock.Anything).Return(nil, errors.New("db error"))
			},
			expectedError: "failed to update todo: db error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(MockTodoRepository)
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTodoService(mockRepo, slog.Default())

			result, err := service.UpdateTodo(tt.id, tt.req)

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestTodoService_DeleteTodo(t *testing.T) {
	tests := []struct {
		name          string
		id            int
		mockSetup     func(*MockTodoRepository)
		expectedError string
	}{
		{
			name: "success",
			id:   1,
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(true, nil)
				m.On("Delete", 1).Return(nil)
			},
		},
		{
			name:          "invalid id",
			id:            0,
			expectedError: "invalid todo ID: 0",
		},
		{
			name: "not found",
			id:   999,
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 999).Return(false, nil)
			},
			expectedError: "todo with id 999 not found",
		},
		{
			name: "exists check error",
			id:   1,
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(false, errors.New("db error"))
			},
			expectedError: "failed to check todo existence: db error",
		},
		{
			name: "delete error",
			id:   1,
			mockSetup: func(m *MockTodoRepository) {
				m.On("Exists", 1).Return(true, nil)
				m.On("Delete", 1).Return(errors.New("db error"))
			},
			expectedError: "failed to delete todo: db error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(MockTodoRepository)
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTodoService(mockRepo, slog.Default())

			err := service.DeleteTodo(tt.id)

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.NoError(t, err)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestTodoService_GetTodoStats(t *testing.T) {
	tests := []struct {
		name          string
		mockSetup     func(*MockTodoRepository)
		expected      map[string]interface{}
		expectedError string
	}{
		{
			name: "success with todos",
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetAll", mock.Anything).Return([]models.Todo{
					{ID: 1, Completed: true},
					{ID: 2, Completed: false},
					{ID: 3, Completed: true},
				}, 3, nil)
			},
			expected: map[string]interface{}{
				"total_todos":     3,
				"completed_todos": 2,
				"pending_todos":   1,
			},
		},
		{
			name: "success with no todos",
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetAll", mock.Anything).Return([]models.Todo{}, 0, nil)
			},
			expected: map[string]interface{}{
				"total_todos":     0,
				"completed_todos": 0,
				"pending_todos":   0,
			},
		},
		{
			name: "error getting todos",
			mockSetup: func(m *MockTodoRepository) {
				m.On("GetAll", mock.Anything).Return([]models.Todo{}, 0, errors.New("db error"))
			},
			expectedError: "failed to get todos: db error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(MockTodoRepository)
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTodoService(mockRepo, slog.Default())

			result, err := service.GetTodoStats()

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

// Helper functions for creating pointers
func strPtr(s string) *string {
	return &s
}

func boolPtr(b bool) *bool {
	return &b
}
