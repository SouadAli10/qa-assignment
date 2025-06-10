# K6 Performance Tests

This directory contains performance tests for the Golang and Node.js APIs using [k6](https://k6.io/), an open-source load testing tool.

These tests are designed to assess the reliability, speed, and scalability of the APIs under different conditions.

## 1. Installation

First, you need to install k6. Follow the [official installation guide](https://k6.io/docs/getting-started/installation/) for your operating system.

**macOS (using Homebrew):**
```bash
brew install k6
```

## 2. Running the Tests

Make sure the backend APIs are running before executing the performance tests.

You can run each test individually from your terminal. Here are the commands for the primary tests:

### API Load Testing
These tests simulate a normal, expected load on the APIs.

**Node.js API:**
```bash
k6 run load-test-nodejs.js
```

**Golang API:**
```bash
k6 run load-test-golang.js
```

### API Stress Testing
This test helps determine the upper limits of the system by gradually increasing the load until the system fails. This helps find the system's breaking point.

```bash
k6 run stress-test.js
```

### API Spike Testing
This test simulates a sudden, extreme increase in traffic to see how the system recovers.

```bash
k6 run spike-test.js
```

By running these tests, the QA engineer can gather metrics on request duration, requests per second, and error rates to assess the performance of each backend service. 