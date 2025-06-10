# E2E Tests using Cypress

This folder contains a starting point for an end-to-end (E2E) test suite using [Cypress](https://www.cypress.io/). These tests interact with the React frontend and its connected backend API.

The purpose of these tests is to verify complete user flows from the UI to the database. You can use these existing tests as a reference and expand upon them.

## Prerequisites

- All three application services (Node.js API, Golang API, React Frontend) must be running.
- You'll need Node.js v18+ installed.

## 1. Installation

First, install the necessary npm packages.

```bash
# Navigate to the e2e-tests directory
cd e2e-tests/

# Install npm dependencies
npm install
```

## 2. Running the Tests

You can run the Cypress tests in two main ways:

### Interactive Mode
This opens the Cypress Test Runner, which is the best tool for development and debugging. You can see your tests run in a real browser, inspect elements, and view command logs.

```bash
# Open the Cypress Test Runner
npm run cypress:open
```

### Headless Mode
This runs all tests from the command line without a visible browser window. This is ideal for running your full test suite or for use in CI/CD pipelines.

```bash
# Run all tests headlessly
npm test
```

## Test Structure

The example tests are located in the `cypress/e2e/` directory.

- `todo-crud.cy.ts`: Contains basic tests for creating, updating, and deleting todos. It's a good example of how to interact with the page elements using Cypress.

Feel free to add new test files or expand the existing ones to cover the scenarios you believe are most important. Good luck!