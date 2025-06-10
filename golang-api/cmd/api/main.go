package main

import (
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/centroidsol/todo-api/internal/config"
	"github.com/centroidsol/todo-api/internal/database"
	"github.com/centroidsol/todo-api/internal/middleware"
	"github.com/centroidsol/todo-api/internal/routes"
	_ "github.com/centroidsol/todo-api/docs" // Import generated docs

	"github.com/gofiber/fiber/v2"
)

// @title Todo API
// @version 1.0.0
// @description A comprehensive Todo API built with Go Fiber following clean architecture principles
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:3001
// @BasePath /api
// @schemes http https

// @tag.name todos
// @tag.description Operations about todos

// @tag.name health
// @tag.description Health check endpoints
func main() {
	// Load configuration
	cfg := config.Load()

	// Setup logger
	logger := setupLogger(cfg)
	logger.Info("Starting Todo API", "version", cfg.App.Version, "environment", cfg.App.Environment)

	// Initialize database
	db, err := database.New(cfg)
	if err != nil {
		logger.Error("Failed to initialize database", "error", err)
		log.Fatal(err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			logger.Error("Failed to close database", "error", err)
		}
	}()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:      cfg.App.Name,
		ErrorHandler: middleware.ErrorHandler(logger),
		Prefork:      false, // Set to true for production if needed
		ServerHeader: "Todo-API/" + cfg.App.Version,
		BodyLimit:    1 * 1024 * 1024, // 1MB
	})

	// Setup routes
	routes.Setup(app, db, cfg, logger)

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan

		logger.Info("Shutting down server...")
		if err := app.Shutdown(); err != nil {
			logger.Error("Server shutdown error", "error", err)
		}
	}()

	// Start server
	address := cfg.Server.Host + ":" + cfg.Server.Port
	logger.Info("Server starting", "address", address)
	
	if cfg.IsDevelopment() {
		logger.Info("Swagger documentation available", "url", "http://"+address+"/swagger/index.html")
	}

	if err := app.Listen(address); err != nil {
		logger.Error("Server startup error", "error", err)
		log.Fatal(err)
	}
}

func setupLogger(cfg *config.Config) *slog.Logger {
	var handler slog.Handler

	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}

	if cfg.IsDevelopment() {
		opts.Level = slog.LevelDebug
		handler = slog.NewTextHandler(os.Stdout, opts)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}