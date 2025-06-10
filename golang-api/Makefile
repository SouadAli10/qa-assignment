.PHONY: help build run dev test test-verbose test-coverage clean docs lint fmt deps check tidy docker-build docker-run

# Variables
APP_NAME := todo-api
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
GO_VERSION := $(shell go version | awk '{print $$3}')
BINARY_PATH := bin/$(APP_NAME)
DOCKER_IMAGE := $(APP_NAME):$(VERSION)

# Build flags
BUILD_FLAGS := -ldflags="-X main.version=$(VERSION) -X main.buildTime=$(BUILD_TIME)"

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the application
	@echo "Building $(APP_NAME) version $(VERSION)..."
	@mkdir -p bin
	@go build $(BUILD_FLAGS) -o $(BINARY_PATH) ./cmd/api
	@echo "Binary built: $(BINARY_PATH)"

run: build ## Build and run the application
	@echo "Running $(APP_NAME)..."
	@./$(BINARY_PATH)

dev: ## Run with hot reload (requires air)
	@if ! command -v air >/dev/null 2>&1; then \
		echo "Installing air for hot reload..."; \
		go install github.com/cosmtrek/air@latest; \
	fi
	@air

test: ## Run tests
	@echo "Running tests..."
	@go test ./... -v

test-verbose: ## Run tests with verbose output
	@echo "Running tests with verbose output..."
	@go test ./... -v -race

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	@go test ./... -v -race -coverprofile=coverage.out
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

benchmark: ## Run benchmarks
	@echo "Running benchmarks..."
	@go test ./... -bench=. -benchmem

docs: ## Generate swagger documentation
	@echo "Generating API documentation..."
	@if ! command -v swag >/dev/null 2>&1; then \
		echo "Installing swag..."; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
	fi
	@swag init -g cmd/api/main.go -o docs/
	@echo "Documentation generated in docs/"

lint: ## Run linter
	@echo "Running linter..."
	@if ! command -v golangci-lint >/dev/null 2>&1; then \
		echo "Installing golangci-lint..."; \
		curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $$(go env GOPATH)/bin; \
	fi
	@golangci-lint run

fmt: ## Format code
	@echo "Formatting code..."
	@go fmt ./...
	@goimports -w .

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	@go mod download

tidy: ## Tidy dependencies
	@echo "Tidying dependencies..."
	@go mod tidy

check: fmt lint test ## Run all checks (format, lint, test)

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf bin/
	@rm -rf docs/
	@rm -f coverage.out coverage.html
	@rm -f *.db

docker-build: ## Build Docker image
	@echo "Building Docker image $(DOCKER_IMAGE)..."
	@docker build -t $(DOCKER_IMAGE) .

docker-run: docker-build ## Build and run Docker container
	@echo "Running Docker container..."
	@docker run --rm -p 3001:3001 --env-file .env $(DOCKER_IMAGE)

docker-compose-up: ## Start services with docker-compose
	@docker-compose up --build

docker-compose-down: ## Stop services with docker-compose
	@docker-compose down

migrate-up: ## Run database migrations up
	@echo "Running database migrations..."
	@go run ./cmd/migrate up

migrate-down: ## Run database migrations down
	@echo "Rolling back database migrations..."
	@go run ./cmd/migrate down

seed: ## Seed database with sample data
	@echo "Seeding database..."
	@go run ./cmd/seed

install-tools: ## Install development tools
	@echo "Installing development tools..."
	@go install github.com/cosmtrek/air@latest
	@go install github.com/swaggo/swag/cmd/swag@latest
	@go install golang.org/x/tools/cmd/goimports@latest

# Development shortcuts
start: dev ## Alias for dev
stop: ## Stop running processes
	@pkill -f "$(APP_NAME)" || true

logs: ## Show application logs (for docker)
	@docker-compose logs -f api

status: ## Check if the API is running
	@curl -s http://localhost:3001/health | jq . || echo "API is not running"

.DEFAULT_GOAL := help