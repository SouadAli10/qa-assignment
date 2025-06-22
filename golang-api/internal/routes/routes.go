package routes

import (
	"log/slog"

	"github.com/centroidsol/todo-api/internal/config"
	"github.com/centroidsol/todo-api/internal/database"
	"github.com/centroidsol/todo-api/internal/handlers"
	"github.com/centroidsol/todo-api/internal/middleware"
	"github.com/centroidsol/todo-api/internal/repository"
	"github.com/centroidsol/todo-api/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/swagger"
)

func Setup(app *fiber.App, db *database.Database, cfg *config.Config, logger *slog.Logger) {
	// Global middleware
	app.Use(recover.New())
	app.Use(middleware.RequestID())
	app.Use(middleware.Logger(logger))
	app.Use(middleware.CORS(cfg))

	// Initialize dependencies
	todoRepo := repository.NewTodoRepository(db.DB())
	todoService := services.NewTodoService(todoRepo, logger)
	todoHandler := handlers.NewTodoHandler(todoService, logger)
	healthHandler := handlers.NewHealthHandler(db, cfg, logger)

	// Health endpoints (outside /api prefix for load balancers)
	app.Get("/health", healthHandler.Health)
	app.Get("/ready", healthHandler.Readiness)
	app.Get("/live", healthHandler.Liveness)
	app.Get("/stats", healthHandler.DatabaseStats)

	// API routes
	api := app.Group("/api")

	// Todo routes
	todos := api.Group("/todos")
	todos.Get("/stats", todoHandler.GetTodoStats)
	todos.Delete("/delete-all", todoHandler.DeleteAllTodos) // Explicit path first
	todos.Get("/", todoHandler.GetTodos)
	todos.Post("/", todoHandler.CreateTodo)
	todos.Get("/:id", todoHandler.GetTodo) // Dynamic routes last
	todos.Put("/:id", todoHandler.UpdateTodo)
	todos.Delete("/:id", todoHandler.DeleteTodo)

	// Swagger documentation (only in development)
	if cfg.IsDevelopment() {
		// Serve Swagger JSON spec
		app.Get("/swagger/doc.json", func(c *fiber.Ctx) error {
			c.Set("Content-Type", "application/json")
			return c.SendFile("./docs/swagger.json")
		})

		// Serve Swagger UI
		app.Get("/swagger/*", swagger.HandlerDefault)
	}

	// 404 handler
	app.Use("*", middleware.NotFoundHandler)
}
