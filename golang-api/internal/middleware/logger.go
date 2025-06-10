package middleware

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
)

func Logger(logger *slog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Process request
		err := c.Next()

		// Log request
		duration := time.Since(start)
		
		logLevel := slog.LevelInfo
		if c.Response().StatusCode() >= 400 {
			logLevel = slog.LevelWarn
		}
		if c.Response().StatusCode() >= 500 {
			logLevel = slog.LevelError
		}

		logger.Log(c.Context(), logLevel, "Request completed",
			"method", c.Method(),
			"path", c.Path(),
			"status", c.Response().StatusCode(),
			"duration", duration.String(),
			"size", len(c.Response().Body()),
			"ip", c.IP(),
			"user_agent", c.Get("User-Agent"),
		)

		return err
	}
}

func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Generate or get request ID
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		// Set request ID in response header
		c.Set("X-Request-ID", requestID)
		
		// Store in locals for use in handlers
		c.Locals("requestID", requestID)

		return c.Next()
	}
}

func generateRequestID() string {
	// Simple request ID generation
	// In production, consider using UUID or similar
	return time.Now().Format("20060102150405") + "-" + randomString(6)
}

func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}