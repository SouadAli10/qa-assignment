# Test Scenario Guide for the Todo List API

## Overview
This document provides a guide with suggested test scenarios to help you validate the Todo List API. You are not expected to implement every single scenario. Instead, use this as a reference to build a high-quality test suite that demonstrates your skills and testing philosophy.

Focus on creating a comprehensive and well-structured suite for the core functionalities.

## 1. Core Testing Areas

We recommend focusing your efforts on these critical areas.

### 1.1 Authentication & Authorization
- **User Registration:** Test successful registration, duplicate email handling, and invalid inputs (weak password, bad email format).
- **User Login:** Test successful login, handling of incorrect credentials, and basic security against brute-force attacks.
- **Access Control:** Ensure that authenticated endpoints are protected and that users can only access their own data (e.g., User A cannot read or delete User B's todos).

### 1.2 Todo CRUD Operations
- **Create, Read, Update, Delete (CRUD):**
  - **Positive Scenarios:** Verify that creating, viewing, updating, and deleting todos works as expected.
  - **Negative Scenarios:** Test for expected failures, such as trying to fetch a non-existent todo (should return 404) or updating another user's todo (should return 403).
  - **Data Validation:** Ensure the API correctly validates input (e.g., rejects a todo with a title that is too long or an invalid priority level).

### 1.3 Business Logic
- **Filtering & Pagination:** Verify that filtering todos by status or priority works correctly and that pagination behaves as expected (e.g., respects page size and offset).
- **Search:** Test the search functionality to ensure it returns relevant results.

### 1.4 Error Handling
- **Status Codes:** Check that the API returns appropriate HTTP status codes (e.g., 200, 201, 400, 401, 403, 404).
- **Error Responses:** Verify that error messages are clear and provide useful context when a request fails.

## 2. Optional & Advanced Scenarios

If you have time and wish to demonstrate additional skills, consider exploring these areas.

### 2.1 Advanced Security Testing
- **Input Sanitization:** Test for common vulnerabilities like SQL Injection or Cross-Site Scripting (XSS) in input fields.
- **Rate Limiting:** Verify that the API's rate limiting is working.

### 2.2 Performance Testing
- **Load & Stress Testing:** Use a tool like k6 to simulate multiple users accessing the API concurrently.
- **Response Time Analysis:** Measure the response time of key endpoints under load.

### 2.3 End-to-End (E2E) Flow Testing
- **User Journeys:** Test a complete user flow, such as Register -> Login -> Create a Category -> Create a Todo -> Mark Todo as Complete -> Logout.
- **Note on Tooling:** You are free to use any E2E testing framework you are comfortable with (e.g., Cypress, Selenium, Playwright). The `e2e-tests` folder in this project provides an example using Cypress, but it is only a reference.

### 2.4 API Documentation Testing
- **Swagger/OpenAPI Validation:** Check that the API documentation is accurate and that the example requests work as described.

## A Note on Your Submission

The goal of this assignment is to assess your approach to quality assurance. We value a well-thought-out and well-written test suite over one that simply has the most tests. Focus on demonstrating your ability to write clean, maintainable, and effective tests that cover the most critical aspects of the API. Good luck!