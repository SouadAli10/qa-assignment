# Performance Testing

This directory contains scripts and resources for performance testing the Todo List APIs using [k6](https://k6.io/).

## Overview

The scripts provided here are examples that can be used as a starting point for the optional performance testing task. They demonstrate how to run different types of load tests (e.g., load, stress, spike) against both the Node.js and Golang backends.

## Your Task

For the actual assignment instructions and goals for the optional performance testing task, please refer to the main guide in the `docs` directory:

[**-> Go to Performance Testing Guide**](../docs/performance-testing-guide.md)

That guide contains the high-level goals and expectations for the assessment. The files in this directory are resources to help you get started.

## Prerequisites

1. **Install K6**
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Windows
   winget install k6
   ```

2. **Running APIs**
   Ensure both APIs are running:
   - Node.js API: `http://localhost:3000`
   - Go API: `http://localhost:3001`

## Test Types

### 1. Load Testing
Tests normal expected load to verify performance under typical usage.

- **Duration**: 16 minutes
- **Load Pattern**: Gradual ramp-up to 50 users
- **Thresholds**: 95% requests < 500ms, error rate < 10%

```bash
# Node.js API
k6 run k6/load-test-nodejs.js

# Go API  
k6 run k6/load-test-golang.js
```

### 2. Stress Testing
Tests beyond normal capacity to find breaking points.

- **Duration**: 30 minutes
- **Load Pattern**: Ramp up to 400 users
- **Thresholds**: 99% requests < 1000ms, error rate < 30%

```bash
# Test Node.js API
API_TYPE=nodejs k6 run k6/stress-test.js

# Test Go API
API_TYPE=golang k6 run k6/stress-test.js
```

### 3. Spike Testing
Tests sudden traffic spikes to verify system resilience.

- **Duration**: 8 minutes
- **Load Pattern**: Sudden spike to 1400 users
- **Thresholds**: 99% requests < 2000ms, error rate < 50%

```bash
# Test Node.js API
API_TYPE=nodejs k6 run k6/spike-test.js

# Test Go API
API_TYPE=golang k6 run k6/spike-test.js
```

## Automated Test Runner

Use the provided script to run all tests:

```bash
# Run all tests on both APIs
./run-tests.sh

# Run specific test type
./run-tests.sh -t load
./run-tests.sh -t stress  
./run-tests.sh -t spike

# Run on specific API
./run-tests.sh -a nodejs
./run-tests.sh -a golang

# Combine options
./run-tests.sh -t load -a nodejs
```

## Test Scenarios

Each test includes multiple scenarios:

1. **GET /api/todos** (40-70% of traffic)
   - Retrieve all todos
   - Most common operation

2. **POST /api/todos** (20-30% of traffic)
   - Create new todos
   - Includes validation testing

3. **PUT /api/todos/:id** (10-20% of traffic)
   - Update existing todos
   - Tests data modification

4. **DELETE /api/todos/:id** (5-15% of traffic)
   - Delete todos
   - Cleanup operations

## Metrics and Thresholds

### Standard Metrics
- **Response Time**: p95, p99 percentiles
- **Error Rate**: Failed requests percentage
- **Throughput**: Requests per second
- **Virtual Users**: Concurrent users

### Custom Metrics
- **Error Rate**: Custom tracking of failed operations
- **Operation Success**: Per-endpoint success rates

## Output and Reporting

Tests generate:
1. **Console Output**: Real-time metrics during test execution
2. **JSON Results**: Detailed metrics in `results/` directory
3. **HTML Reports**: Visual reports (if k6-html-reporter installed)

### Installing HTML Reporter
```bash
npm install -g k6-html-reporter
```

## Performance Comparison

The tests allow comparing performance between:
- **Node.js (Fastify)** vs **Go (Fiber)**
- Different load patterns
- Various optimization strategies

## Interpreting Results

### Good Performance Indicators
- Response times under thresholds
- Low error rates
- Stable throughput
- Graceful degradation under load

### Warning Signs
- Increasing response times
- Rising error rates
- Memory leaks (monitor separately)
- Connection timeouts

## Best Practices

1. **Baseline Testing**: Run tests on stable code
2. **Environment Consistency**: Use consistent test environments
3. **Gradual Load Increase**: Start with small loads
4. **Monitor Resources**: Watch CPU, memory, disk I/O
5. **Test Isolation**: Run tests separately to avoid interference

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify APIs are running
   - Check correct ports (3000, 3001)

2. **High Error Rates**
   - Reduce load gradually
   - Check API logs for errors
   - Verify database connections

3. **Timeouts**
   - Increase timeout values
   - Check network latency
   - Monitor system resources

### Debugging Commands

```bash
# Check API health
curl http://localhost:3000/health
curl http://localhost:3001/health

# Monitor API logs
# (Check API terminal outputs)

# System resources
top
htop
iostat
```

## CI/CD Integration

For automated testing in CI/CD:

```bash
# Example CI script
./run-tests.sh -t load
if [ $? -eq 0 ]; then
    echo "Performance tests passed"
else
    echo "Performance tests failed"
    exit 1
fi
```

## Advanced Usage

### Custom Test Parameters

Modify test files for custom scenarios:
- User load patterns
- Request timing
- Test duration
- Threshold values

### Environment Variables

- `API_TYPE`: Choose 'nodejs' or 'golang'
- `BASE_URL`: Override default URLs
- `TEST_DURATION`: Customize test duration

### Database Considerations

For production-like testing:
- Use production-like databases
- Pre-populate with realistic data
- Monitor database performance separately