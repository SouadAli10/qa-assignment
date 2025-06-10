package handlers

import (
	"log/slog"
	"time"

	"github.com/centroidsol/todo-api/internal/config"
	"github.com/centroidsol/todo-api/internal/database"
	"github.com/centroidsol/todo-api/internal/models"
	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
	db     *database.Database
	cfg    *config.Config
	logger *slog.Logger
	start  time.Time
}

func NewHealthHandler(db *database.Database, cfg *config.Config, logger *slog.Logger) *HealthHandler {
	return &HealthHandler{
		db:     db,
		cfg:    cfg,
		logger: logger,
		start:  time.Now(),
	}
}

// Health godoc
// @Summary Health check
// @Description Get health status of the API
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} models.HealthResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /health [get]
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	// Check database connection
	if err := h.db.Ping(); err != nil {
		h.logger.Error("Database health check failed", "error", err)
		return c.Status(fiber.StatusServiceUnavailable).JSON(models.ErrorResponse{
			Error: "Database connection failed",
			Code:  fiber.StatusServiceUnavailable,
		})
	}

	uptime := time.Since(h.start)

	response := models.HealthResponse{
		Status:    "ok",
		Timestamp: time.Now(),
		Version:   h.cfg.App.Version,
		Uptime:    uptime.String(),
	}

	return c.JSON(response)
}

// Readiness godoc
// @Summary Readiness check
// @Description Check if the API is ready to serve requests
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 503 {object} models.ErrorResponse
// @Router /ready [get]
func (h *HealthHandler) Readiness(c *fiber.Ctx) error {
	checks := map[string]interface{}{
		"database": "ok",
		"status":   "ready",
	}

	// Check database
	if err := h.db.Ping(); err != nil {
		checks["database"] = "failed: " + err.Error()
		checks["status"] = "not ready"
		
		return c.Status(fiber.StatusServiceUnavailable).JSON(checks)
	}

	return c.JSON(checks)
}

// Liveness godoc
// @Summary Liveness check
// @Description Check if the API is alive
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /live [get]
func (h *HealthHandler) Liveness(c *fiber.Ctx) error {
	return c.JSON(map[string]interface{}{
		"status":    "alive",
		"timestamp": time.Now(),
	})
}

// DatabaseStats godoc
// @Summary Get database statistics
// @Description Get detailed database connection and data statistics
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} models.ErrorResponse
// @Router /stats [get]
func (h *HealthHandler) DatabaseStats(c *fiber.Ctx) error {
	stats, err := h.db.Stats()
	if err != nil {
		h.logger.Error("Failed to get database stats", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse{
			Error: "Failed to get database statistics",
			Code:  fiber.StatusInternalServerError,
		})
	}

	// Add additional stats
	stats["app_uptime"] = time.Since(h.start).String()
	stats["app_version"] = h.cfg.App.Version
	stats["environment"] = h.cfg.App.Environment

	return c.JSON(stats)
}