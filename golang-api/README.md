# Todo API - Go Fiber

A comprehensive Todo API built with Go Fiber following clean architecture principles and best practices.

## 🚀 Features

- **Clean Architecture**: Properly organized layers (handlers, services, repository)
- **Dependency Injection**: Loose coupling between components
- **Comprehensive Logging**: Structured logging with slog
- **Configuration Management**: Environment-based configuration
- **Database**: SQLite with proper connection pooling
- **API Documentation**: Swagger/OpenAPI 3.0 integration
- **Docker Support**: Multi-stage Docker builds
- **Testing**: Unit and integration tests
- **Middleware**: CORS, logging, error handling, request ID
- **Health Checks**: Kubernetes-ready health endpoints

## 🏗️ Architecture

```
cmd/
├── api/                    # Application entry point
internal/
├── config/                 # Configuration management
├── database/               # Database connection and migration
├── handlers/               # HTTP handlers (controllers)
├── middleware/             # HTTP middleware
├── models/                 # Domain models and DTOs
├── repository/             # Data access layer
├── routes/                 # Route definitions
└── services/              # Business logic layer
```

## 📋 Prerequisites

- **Go 1.21+**
- **Make** (optional but recommended)
- **Docker** (optional)
- **SQLite** (included with Go)

## ⚡ Quick Start

### Simple Start (Recommended)
```bash
# Install dependencies
go mod tidy

# Run the application
go run cmd/api/main.go
```

The API will be available at **http://localhost:3001**

### Using Make (If Available)
```bash
# Install dependencies
make deps

# Generate API documentation
make docs

# Run in development mode (hot reload)
make dev

# Or build and run
make run
```

### Manual Setup
```bash
# Download dependencies
go mod download

# Generate Swagger docs (if swag is installed)
swag init -g cmd/api/main.go -o docs/

# Run the application
go run cmd/api/main.go
```

## 🐳 Docker

### Build and Run
```bash
# Build Docker image
make docker-build

# Run with Docker
make docker-run

# Or use docker-compose
docker-compose up --build
```

### Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🌐 API Endpoints

### Health Endpoints
- `GET /health` - Health check
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe  
- `GET /stats` - Database statistics

### Todo Endpoints
- `GET /api/todos` - Get all todos (with pagination, filtering, sorting)
- `GET /api/todos/:id` - Get todo by ID
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `GET /api/todos/stats` - Get todo statistics

### Documentation
- `GET /swagger/*` - Swagger UI (development only)

## 📊 API Documentation

Access the interactive API documentation:
- **Swagger UI**: http://localhost:3001/swagger/index.html
- **OpenAPI JSON**: http://localhost:3001/swagger/doc.json

## ⚙️ Configuration

Configuration is managed through environment variables or `.env` file:

```bash
# Server Configuration
PORT=3001
HOST=0.0.0.0

# Database Configuration  
DATABASE_PATH=./todos.db

# Application Configuration
APP_NAME=Todo API
APP_VERSION=1.0.0
ENVIRONMENT=development
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run tests with race detection
make test-verbose

# Run benchmarks
make benchmark
```

### Test Structure
```
internal/
├── handlers/
│   └── handlers_test.go
├── services/
│   └── services_test.go
├── repository/
│   └── repository_test.go
└── database/
    └── database_test.go
```

## 🔧 Development

### Available Make Commands
```bash
make help          # Show all available commands
make dev            # Run with hot reload
make build          # Build binary
make test           # Run tests
make test-coverage  # Run tests with coverage
make lint           # Run linter
make fmt            # Format code
make docs           # Generate documentation
make clean          # Clean build artifacts
```

### Code Quality
```bash
# Format code
make fmt

# Run linter
make lint

# Run all checks
make check
```

## 📡 API Usage Examples

### Create Todo
```bash
curl -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Go Fiber",
    "description": "Build a REST API with Go Fiber framework",
    "completed": false
  }'
```

### Get All Todos
```bash
# Basic request
curl http://localhost:3001/api/todos

# With pagination and filtering
curl "http://localhost:3001/api/todos?page=1&per_page=10&sort=created_at&order=desc&completed=false"

# Search todos
curl "http://localhost:3001/api/todos?search=fiber"
```

### Update Todo
```bash
curl -X PUT http://localhost:3001/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Go Fiber - Updated",
    "completed": true
  }'
```

### Delete Todo
```bash
curl -X DELETE http://localhost:3001/api/todos/1
```

### Health Check
```bash
curl http://localhost:3001/health
```

## 🏥 Health Checks

The API provides multiple health check endpoints:

- **`/health`**: Basic health check with uptime and version
- **`/ready`**: Readiness probe (checks database connectivity)
- **`/live`**: Liveness probe (always returns 200)
- **`/stats`**: Detailed statistics (database connections, todo counts)

Perfect for Kubernetes deployments:

```yaml
livenessProbe:
  httpGet:
    path: /live
    port: 3001
readinessProbe:
  httpGet:
    path: /ready
    port: 3001
```

## 🔍 Monitoring & Logging

### Structured Logging
All logs are structured using Go's `slog` package:

```json
{
  "time": "2024-01-01T12:00:00Z",
  "level": "INFO", 
  "msg": "Request completed",
  "method": "GET",
  "path": "/api/todos",
  "status": 200,
  "duration": "2.5ms"
}
```

### Request Tracing
Every request gets a unique `X-Request-ID` header for tracing.

## 🚀 Deployment

### Environment Variables
Set these in production:

```bash
ENVIRONMENT=production
PORT=3001
DATABASE_PATH=/data/todos.db
```

### Docker Production
```dockerfile
# Use multi-stage build for minimal image
FROM alpine:latest
# ... (see Dockerfile for full setup)
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: todo-api
  template:
    metadata:
      labels:
        app: todo-api
    spec:
      containers:
      - name: todo-api
        image: todo-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: ENVIRONMENT
          value: "production"
        livenessProbe:
          httpGet:
            path: /live
            port: 3001
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database locked**
   ```bash
   rm -f todos.db
   # Restart the application
   ```

3. **Swagger docs not loading**
   ```bash
   make docs  # Regenerate documentation
   ```

### Debug Mode
Set `ENVIRONMENT=development` for detailed logs and Swagger UI.

## 📈 Performance

- **Benchmarks**: Run `make benchmark` for performance metrics
- **Profiling**: Built-in pprof endpoints in development mode
- **Connection Pooling**: Optimized SQLite connection management
- **Middleware**: Efficient request/response processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow Go best practices and idioms
- Add tests for new features
- Update documentation
- Run `make check` before submitting PR
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Fiber](https://github.com/gofiber/fiber) - Web framework
- [Swagger](https://swagger.io/) - API documentation
- [Go](https://golang.org/) - Programming language
- Clean Architecture principles by Robert C. Martin