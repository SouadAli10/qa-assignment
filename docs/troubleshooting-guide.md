# Troubleshooting Guide

## Overview
This is a supplementary guide to help you solve common setup and runtime problems. You are not expected to read this document upfront or know everything in it.

If you run into an issue, this guide may have a quick solution for you. If you don't find your answer here, feel free to reach out for help.

## Quick Diagnostic Checklist

First, ensure the basics are covered:

- **✅ System Requirements:** You have Node.js v18+, Go v1.21+, and `git` installed.
- **✅ Service Status:** All three services (Node.js API, Golang API, React Frontend) are running in separate terminal windows.
- **✅ Port Availability:** Ports `3000`, `3001`, and `5173` are not being used by other applications.

---

## Common Issues & Solutions

### 1. Port Already in Use
This is the most common issue.

- **Symptom:** You see an error like `EADDRINUSE` or `address already in use`.
- **Solution:** Find and stop the process using the port. On macOS or Linux:
  ```bash
  # Find the process ID (PID) using the port
  lsof -i :3000

  # Stop the process
  kill -9 <PID>
  ```

### 2. An API or the Frontend Won't Start
Sometimes dependencies can get corrupted. A clean re-install usually fixes this.

- **Symptom:** The application crashes on start with an error like `module not found`.
- **Solution:** For the specific service (e.g., `nodejs-api/`):
  ```bash
  # Navigate to the service directory
  cd nodejs-api/

  # Remove old dependencies and caches
  rm -rf node_modules package-lock.json

  # Re-install cleanly
  npm install

  # Try starting it again
  npm start
  ```
  *(The same `rm -rf node_modules` logic applies to `frontend/`)*

### 3. Golang API Fails to Build
Go module issues can be fixed by cleaning the module cache.

- **Symptom:** The Go API fails to start with compilation or module errors.
- **Solution:**
  ```bash
  cd golang-api/

  # Clean the module cache
  go clean -modcache

  # Re-download dependencies and verify them
  go mod tidy

  # Try running it again
  go run cmd/api/main.go
  ```

### 4. CORS Errors in the Browser
This happens when the frontend cannot communicate with one of the APIs.

- **Symptom:** You see a `CORS policy` error in the browser's developer console.
- **Solution:**
  1.  Ensure **both** the Node.js and Golang APIs are running at the same time as the frontend.
  2.  Verify the URLs in your browser. The frontend should be on `http://localhost:5173`.
  3.  A hard refresh of your browser tab can sometimes resolve caching issues.

### 5. "Database is Locked" Error
This is a common issue with SQLite when multiple processes try to access the database file simultaneously.

- **Symptom:** The API logs show a "database is locked" error.
- **Solution:** The simplest fix is to stop the APIs and restart them. This resets the connection pool.
  1. Stop both the Node.js and Golang API processes.
  2. Restart them one by one.

---

## The "Emergency Reset"

If you're completely stuck and nothing seems to work, this set of commands will reset the entire project to a clean state.

```bash
# Stop any running node or go processes
pkill -f node
pkill -f main

# Clean the Node.js API
echo "Cleaning Node.js API..."
cd nodejs-api/
rm -rf node_modules package-lock.json todos.db
cd ..

# Clean the Golang API
echo "Cleaning Golang API..."
cd golang-api/
rm -f todos.db
go clean -modcache
cd ..

# Clean the Frontend App
echo "Cleaning Frontend App..."
cd frontend/
rm -rf node_modules pnpm-lock.yaml
cd ..

# Re-install all dependencies
echo "Re-installing all dependencies..."
(cd nodejs-api && npm install)
(cd golang-api && go mod tidy)
(cd frontend && pnpm install)

echo "✅ Clean install complete. You can now start the services in separate terminals."
```