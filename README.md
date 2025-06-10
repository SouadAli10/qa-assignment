# QA Engineering Assignment - Todo List API

## Overview
This assignment is designed to evaluate QA engineering skills through testing a Todo List API implementation. The candidate should demonstrate their ability to create comprehensive test suites for REST APIs in a fintech context.

## Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Go 1.21+
- Git

### Running the Complete Application

1. **Clone and Navigate to the Assignment**
   ```bash
   cd backend-assignment/
   ```

2. **Start the Node.js API (Port 3000)**
   ```bash
   cd nodejs-api/
   npm install
   npm start
   ```
   - API available at: http://localhost:3000
   - Documentation: http://localhost:3000/docs
   - Health check: http://localhost:3000/health

3. **Start the Golang API (Port 3001)** *(in a new terminal)*
   ```bash
   cd golang-api/
   go mod tidy
   go run cmd/api/main.go
   ```
   - API available at: http://localhost:3001
   - Documentation: http://localhost:3001/swagger/index.html
   - Health check: http://localhost:3001/health

4. **Start the React Frontend (Port 5173)** *(in a new terminal)*
   ```bash
   cd frontend/
   pnpm install
   pnpm run dev
   ```
   - Frontend available at: http://localhost:5173
   - Can switch between Node.js and Golang APIs in the UI

### Assignment Structure

```
backend-assignment/
├── docs/
│   ├── requirements.md         # Detailed API requirements
│   ├── test-scenarios.md       # Test scenarios to implement
│   └── performance-testing-guide.md
├── nodejs-api/                 # Complete Node.js implementation
│   ├── src/                    # Source code
│   ├── tests/                  # Test directories
│   ├── package.json           # Dependencies
│   └── README.md              # Detailed setup instructions
├── golang-api/                 # Complete Golang implementation
│   ├── cmd/api/               # Main application
│   ├── internal/              # Business logic
│   ├── tests/                 # Test directories
│   ├── go.mod                 # Go modules
│   └── README.md              # Detailed setup instructions
├── frontend/                   # React frontend with shadcn/ui
│   ├── src/                   # Source code
│   ├── package.json           # Dependencies
│   └── README.md              # Frontend setup instructions
├── e2e-tests/                  # Example E2E test suite
│   ├── cypress/               # Example Cypress tests
│   └── README.md              # E2E testing instructions
└── performance/                # Performance testing tools
    ├── k6/                    # K6 load test scripts
    └── README.md              # Performance testing guide
```

## Assignment Task

The Todo List API is already implemented in both Node.js (using Fastify) and Golang (using Fiber). Your primary task is to develop a comprehensive test suite for the Todo List API. You have the choice to focus on **either** the `nodejs` **or** the `golang` implementation provided in this repository.

### Getting Started
1. Read `docs/requirements.md` for API specifications.
2. Choose either the Node.js or Golang implementation to test.
3. Review `docs/test-scenarios.md` for an idea of the required test coverage.
4. Implement your test suites in the appropriate folders.

### Requirements

Your test suite should:

*   **Cover Core Functionality:** Ensure all API endpoints and business logic as defined in `docs/requirements.md` and `docs/test-scenarios.md` are thoroughly tested with both positive and negative scenarios.
*   **Be Automated:** Tests should be scriptable and repeatable.
*   **Address Security Concerns:** Include tests for common API vulnerabilities such as authentication/authorization flaws and input validation issues relevant to a fintech context.
*   **Adhere to Best Practices:** Write clean, maintainable, and well-documented test code.

**Optional - Performance Testing:**
If you have experience with performance testing or wish to demonstrate these skills, you are encouraged to:
*   Develop and execute performance tests against your chosen API implementation (you may find the `performance/k6` directory useful as a starting point or inspiration).
*   Report on key performance metrics and any observations.

Choosing to test only one implementation (Node.js or Golang) is the standard expectation. Testing both is considered "Going Above & Beyond."

### Submission Requirements

Candidates should provide:
1. A link to a Git repository with your test code.
2. Clear setup and execution instructions in the `README.md`.
3. A brief summary of your testing approach and any findings.
4. (Optional) CI/CD pipeline configuration.
5. (Optional) Test execution reports.

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :3000  # Node.js API
lsof -i :3001  # Golang API  
lsof -i :5173  # React frontend

# Kill processes if needed
kill -9 <PID>
```

**Node.js API won't start:**
```bash
cd nodejs-api/
rm -rf node_modules package-lock.json
npm install
npm start
```

**Golang API won't start:**
```bash
cd golang-api/
go clean -modcache
go mod tidy
go run cmd/api/main.go
```

**React frontend won't start:**
```bash
cd frontend/
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run dev
```

**Database issues:**
```bash
# Remove database files and restart
rm nodejs-api/todos.db
rm golang-api/todos.db
# Restart the APIs
```

**CORS errors in browser:**
- Ensure both APIs are running
- Check that the frontend is using the correct API URLs
- Verify CORS configuration in the API code

### Quick Health Checks

```bash
# Test Node.js API
curl http://localhost:3000/health

# Test Golang API  
curl http://localhost:3001/health

# Test React frontend (should return HTML)
curl http://localhost:5173/
```

### Performance Issues

If the APIs are slow:
1. Check your system resources
2. Restart the database connections
3. Clear any large database files
4. Use the performance testing tools in `/performance/`

## Support

For questions about the assignment:
Contact Marwan Alameddine

---