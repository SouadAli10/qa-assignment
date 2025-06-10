# Node.js Todo API (Fastify)

## Overview
A comprehensive Todo List API built with Fastify following modern Node.js best practices. This implementation features robust error handling, validation, logging, and comprehensive API documentation.

## Features
- ✅ **Full CRUD Operations** - Create, Read, Update, Delete todos
- ✅ **Data Validation** - Input validation using Zod schemas
- ✅ **SQLite Database** - Lightweight, file-based database with migrations
- ✅ **API Documentation** - Swagger/OpenAPI documentation
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Health Checks** - Application and database health monitoring
- ✅ **CORS Support** - Cross-origin resource sharing
- ✅ **Rate Limiting** - Request rate limiting for API protection
- ✅ **Security Headers** - Helmet.js security middleware
- ✅ **Request Logging** - Detailed request/response logging

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   The API will be available at http://localhost:3000

3. **Start Production Server**
   ```bash
   npm start
   ```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/ready` | Readiness check endpoint |
| GET | `/api/todos` | Get all todos (with pagination) |
| GET | `/api/todos/:id` | Get specific todo |
| POST | `/api/todos` | Create new todo |
| PUT | `/api/todos/:id` | Update existing todo |
| DELETE | `/api/todos/:id` | Delete todo |
| GET | `/api/todos/stats` | Get todo statistics |
| PATCH | `/api/todos/:id/toggle` | Toggle todo completion |

### API Documentation
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs/json

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
HOST=0.0.0.0
PORT=3000

# Database Configuration
DATABASE_PATH=./todos.db

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute
```

### Database

The API uses SQLite for data storage:
- **Development**: `./todos.db` file
- **Test**: In-memory database
- **Migrations**: Automatic on startup

#### Database Schema
```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

## Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Build & Deployment

```bash
# Build for production
npm run build

# Clean build artifacts
npm run clean

# Generate API documentation
npm run docs:generate
```

### Docker Support

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

## API Usage Examples

### Create a Todo
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Node.js",
    "description": "Study Fastify framework"
  }'
```

### Get All Todos
```bash
curl http://localhost:3000/api/todos
```

### Update a Todo
```bash
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Node.js - Updated",
    "completed": true
  }'
```

### Delete a Todo
```bash
curl -X DELETE http://localhost:3000/api/todos/1
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Project Structure

```
nodejs-api/
├── src/
│   ├── config/          # Configuration management
│   ├── controllers/     # Request handlers
│   ├── database/        # Database connection & migrations
│   ├── middleware/      # Custom middleware
│   ├── models/          # Data models
│   ├── repositories/    # Data access layer
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── tests/               # Test suites
├── docs/               # Generated documentation
├── package.json        # Dependencies & scripts
└── README.md           # This file
```

## Architecture

The API follows a layered architecture:

1. **Routes** - Define endpoints and request handling
2. **Controllers** - Handle HTTP requests/responses
3. **Services** - Business logic and orchestration
4. **Repositories** - Data access and persistence
5. **Models** - Data structures and validation

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**Database locked:**
```bash
# Remove database file and restart
rm todos.db
npm start
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debugging

Enable debug logging:
```bash
DEBUG=* npm start
```

Check application health:
```bash
curl http://localhost:3000/health
```

## Performance

The API includes performance monitoring:
- Request timing logs
- Memory usage tracking
- Event loop delay monitoring
- Database connection pooling

## Security Features

- **Input Validation** - All inputs validated with Zod schemas
- **Rate Limiting** - Configurable request rate limits
- **CORS Protection** - Cross-origin request controls
- **Security Headers** - Helmet.js security middleware
- **Error Sanitization** - Safe error responses
- **Request ID Tracking** - Unique request identification

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Run linting and tests before commits
5. Use conventional commit messages

## License

MIT License - see LICENSE file for details