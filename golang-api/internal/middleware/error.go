package middleware

import (
	"log/slog"

	"github.com/centroidsol/todo-api/internal/models"
	"github.com/gofiber/fiber/v2"
)

func ErrorHandler(logger *slog.Logger) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		code := fiber.StatusInternalServerError
		message := "Internal Server Error"

		// Handle Fiber errors
		if e, ok := err.(*fiber.Error); ok {
			code = e.Code
			message = e.Message
		}

		// Log the error
		logger.Error("Request error",
			"method", c.Method(),
			"path", c.Path(),
			"error", err.Error(),
			"status", code,
			"ip", c.IP(),
			"user_agent", c.Get("User-Agent"),
		)

		// Return error response
		return c.Status(code).JSON(models.ErrorResponse{
			Error: message,
			Code:  code,
		})
	}
}

func NotFoundHandler(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotFound).JSON(models.ErrorResponse{
		Error: "Route not found",
		Code:  fiber.StatusNotFound,
	})
}