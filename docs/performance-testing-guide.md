# Performance Testing Guide

## Overview
This guide provides a starting point for the optional performance testing task. The goal is to assess your ability to design, implement, and analyze basic load tests for the Todo List API.

We recommend using [k6](https://k6.io/), a modern, developer-centric load testing tool.

## Installation
You can find installation instructions for your OS in the [official k6 documentation](https://k6.io/docs/getting-started/installation/).

For macOS, the quickest way is with Homebrew:
```bash
brew install k6
```

## Your Task (Optional)
Your task is to assess the performance of the API implementation you chose to test (either Node.js or Golang). You should focus on the core user-facing endpoints.

### High-Level Goals:
1.  **Create a Basic Load Test:**
    *   Design a test that simulates a realistic number of concurrent users (e.g., 25-50 users) making requests to the API.
    *   Focus on the most common API operations: creating a new todo and listing existing todos.
2.  **Analyze the Results:**
    *   Run your test for a reasonable duration (e.g., 2-5 minutes).
    *   Report on key performance metrics, such as the average/p95 response time and the request throughput (requests per second).
3.  **Identify Bottlenecks (if any):**
    *   Based on your results, provide a brief analysis. Are there any obvious performance issues or bottlenecks? What might be the cause?

### Getting Started
*   The `performance/k6/` directory contains several example k6 scripts (`load-test-nodejs.js`, `load-test-golang.js`, etc.). You are encouraged to **use these as a starting point** and modify them to meet the goals above.
*   Feel free to create new scripts or organize them as you see fit. The existing scripts are just examples.

### What We're Looking For
*   Your thought process in designing the load test.
*   Your ability to write or modify a simple performance test script.
*   Your ability to interpret basic performance metrics and draw conclusions.
*   A clear, concise summary of your findings.