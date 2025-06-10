package middleware

import (
	"github.com/centroidsol/todo-api/internal/config"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func CORS(cfg *config.Config) fiber.Handler {
	corsConfig := cors.Config{
		AllowOrigins:     getAllowedOrigins(cfg),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Request-ID",
		AllowCredentials: false,
		ExposeHeaders:    "X-Request-ID",
	}

	if cfg.IsDevelopment() {
		corsConfig.AllowOrigins = "*"
		corsConfig.AllowCredentials = true
	}

	return cors.New(corsConfig)
}

func getAllowedOrigins(cfg *config.Config) string {
	if cfg.IsDevelopment() {
		return "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
	}
	
	// In production, specify your actual frontend domains
	return "https://yourdomain.com"
}