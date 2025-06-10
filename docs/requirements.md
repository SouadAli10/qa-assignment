# Todo List API - Requirements

**Note:** The Todo List API is already implemented in both Node.js (using Fastify) and Golang (using Fiber). Your assignment is to design, automate, and report on tests for these APIs. You do not need to implement the API itself.

## Overview
This document outlines the requirements and specifications of the pre-built Todo List API that you will be testing. The goal of the assignment is to evaluate your ability to design clean, maintainable, and well-tested API test suites following best practices for a fintech CRM environment.

## Business Requirements

### Core Features
The Todo List API should support:
1. **User Management**: Simple authentication system
2. **Todo Operations**: CRUD operations for todo items
3. **Categories**: Organize todos into categories
4. **Priority Levels**: High, Medium, Low
5. **Due Dates**: Track deadlines
6. **Audit Trail**: Track creation and modification times

### Technical Requirements

#### 1. API Endpoints
The API exposes the following RESTful endpoints:

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (return JWT token)

**Todos**
- `GET /api/todos` - List all todos (with pagination)
- `POST /api/todos` - Create new todo
- `GET /api/todos/:id` - Get specific todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `PATCH /api/todos/:id/complete` - Mark todo as complete

**Categories**
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category
- `GET /api/todos/category/:categoryId` - Get todos by category

**Filters & Search**
- `GET /api/todos?status=pending&priority=high` - Filter todos
- `GET /api/todos/search?q=keyword` - Search todos

#### 2. Data Models

**User**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "password": "hashed",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Todo**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Complete API assignment",
  "description": "Build a robust Todo API",
  "categoryId": "uuid",
  "priority": "high|medium|low",
  "status": "pending|completed",
  "dueDate": "2024-01-10T00:00:00Z",
  "completedAt": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Category**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Work",
  "color": "#FF5733",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### 3. Technical Specifications

**The Node.js Implementation:**
- Is built using Fastify
- Uses TypeScript
- Is tested with Jest
- Includes request validation using Zod

**The Golang Implementation:**
- Is built using the Fiber framework
- Follows standard Go module structure
- Uses the standard Go testing package
- Includes request validation

**Both Implementations Include:**
- JWT authentication
- Input validation
- Error handling with appropriate HTTP status codes
- Request/Response logging
- Rate limiting
- CORS configuration
- Environment configuration (.env support)
- A Dockerfile for containerization
- Database migrations
- OpenAPI/Swagger documentation

#### 4. Database Requirements
- The application uses an SQLite database.
- The schema and migrations are included in the project.
- The implementation includes proper indexes for performance and handles database connection pooling.

#### 5. Security Requirements
- The API implements the following security measures:
- Password hashing (bcrypt)
- JWT token expiration
- Input sanitization to prevent injection attacks
- Rate limiting per user
- Secure headers

#### 6. Testing Requirements
Your test suite should implement comprehensive tests, including:
- Unit tests for business logic
- Integration tests for API endpoints
- Authentication/Authorization tests
- Input validation tests
- Error handling tests

## Submission Instructions

1. Create a private GitHub repository for your test suite.
2. Ensure your solution is fully implemented and includes all necessary documentation for running it.
3. In your `README.md`, please provide:
   - Your approach to testing the API.
   - Any architectural decisions made in your test suite.
   - Challenges you faced.
   - Improvements you'd make with more time.
4. Share the repository access with: [interviewer email]

## Notes
This assignment simulates real-world API testing challenges in a fintech environment while allowing candidates to showcase their QA engineering expertise.

## Questions?
If you have questions about requirements, please email with subject: "QA Assignment Clarification - [Your Name]"

---
Good luck! We look forward to reviewing your implementation.