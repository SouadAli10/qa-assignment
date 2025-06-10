import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 }, // Stay at 50 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be less than 10%
    errors: ['rate<0.1'],             // Custom error rate should be less than 10%
  },
};

const BASE_URL = 'http://localhost:3001';

// Test data
const testTodos = [
  { title: 'Load Test Todo 1', description: 'Description for todo 1' },
  { title: 'Load Test Todo 2', description: 'Description for todo 2' },
  { title: 'Load Test Todo 3', description: 'Description for todo 3' },
  { title: 'Load Test Todo 4', description: 'Description for todo 4' },
  { title: 'Load Test Todo 5', description: 'Description for todo 5' },
];

export function setup() {
  // Setup phase - run once before the load test
  console.log('Starting load test for Go API');
  
  // Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'Health check successful': (r) => r.status === 200,
  });
  
  return { baseUrl: BASE_URL };
}

export default function (data) {
  // Main test function - runs for each virtual user
  const baseUrl = data.baseUrl;
  
  // Test scenario weights
  const scenarios = [
    { name: 'getTodos', weight: 40 },
    { name: 'createTodo', weight: 25 },
    { name: 'updateTodo', weight: 20 },
    { name: 'deleteTodo', weight: 15 },
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  switch (scenario.name) {
    case 'getTodos':
      testGetTodos(baseUrl);
      break;
    case 'createTodo':
      testCreateTodo(baseUrl);
      break;
    case 'updateTodo':
      testUpdateTodo(baseUrl);
      break;
    case 'deleteTodo':
      testDeleteTodo(baseUrl);
      break;
  }
  
  sleep(1); // Wait 1 second between requests
}

function testGetTodos(baseUrl) {
  const response = http.get(`${baseUrl}/api/todos`);
  
  const success = check(response, {
    'GET /api/todos status is 200': (r) => r.status === 200,
    'GET /api/todos response time < 200ms': (r) => r.timings.duration < 200,
    'GET /api/todos returns array': (r) => Array.isArray(JSON.parse(r.body)),
  });
  
  errorRate.add(!success);
}

function testCreateTodo(baseUrl) {
  const todo = testTodos[Math.floor(Math.random() * testTodos.length)];
  const payload = {
    title: `${todo.title} - ${Date.now()}`,
    description: todo.description,
    completed: false,
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.post(`${baseUrl}/api/todos`, JSON.stringify(payload), params);
  
  let createdTodo = null;
  const success = check(response, {
    'POST /api/todos status is 201': (r) => r.status === 201,
    'POST /api/todos response time < 300ms': (r) => r.timings.duration < 300,
    'POST /api/todos returns created todo': (r) => {
      const body = JSON.parse(r.body);
      createdTodo = body;
      return body.title === payload.title && body.description === payload.description;
    },
  });
  
  errorRate.add(!success);
  
  return createdTodo;
}

function testUpdateTodo(baseUrl) {
  // First, get existing todos
  const getTodosResponse = http.get(`${baseUrl}/api/todos`);
  
  if (getTodosResponse.status !== 200) {
    errorRate.add(true);
    return;
  }
  
  const todos = JSON.parse(getTodosResponse.body);
  let randomTodo;
  
  if (todos.length === 0) {
    // If no todos, create one and use it for the test
    const newTodo = testCreateTodo(baseUrl);
    if (!newTodo) {
      errorRate.add(true);
      return; // Can't proceed
    }
    randomTodo = newTodo;
  } else {
    // Otherwise, pick a random one
    randomTodo = todos[Math.floor(Math.random() * todos.length)];
  }
  
  const updatePayload = {
    title: `Updated Todo - ${Date.now()}`,
    completed: !randomTodo.completed,
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.put(`${baseUrl}/api/todos/${randomTodo.id}`, JSON.stringify(updatePayload), params);
  
  const success = check(response, {
    'PUT /api/todos/:id status is 200': (r) => r.status === 200,
    'PUT /api/todos/:id response time < 300ms': (r) => r.timings.duration < 300,
    'PUT /api/todos/:id returns updated todo': (r) => {
      const body = JSON.parse(r.body);
      return body.title === updatePayload.title;
    },
  });
  
  errorRate.add(!success);
}

function testDeleteTodo(baseUrl) {
  // First, create a todo to delete
  const newTodo = testCreateTodo(baseUrl);
  
  if (!newTodo || !newTodo.id) {
    errorRate.add(true);
    return;
  }
  
  sleep(0.1); // Small delay to ensure todo is created
  
  const response = http.del(`${baseUrl}/api/todos/${newTodo.id}`);
  
  const success = check(response, {
    'DELETE /api/todos/:id status is 204': (r) => r.status === 204,
    'DELETE /api/todos/:id response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!success);
}

export function teardown(data) {
  // Cleanup phase - run once after the load test
  console.log('Load test completed for Go API');
}