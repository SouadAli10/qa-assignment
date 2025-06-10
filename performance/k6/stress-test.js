import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 },  // Stay at 200 users for 5 minutes
    { duration: '2m', target: 300 },  // Ramp up to 300 users over 2 minutes
    { duration: '5m', target: 300 },  // Stay at 300 users for 5 minutes
    { duration: '2m', target: 400 },  // Ramp up to 400 users over 2 minutes
    { duration: '5m', target: 400 },  // Stay at 400 users for 5 minutes
    { duration: '10m', target: 0 },   // Ramp down to 0 users over 10 minutes
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% of requests should be below 1000ms
    http_req_failed: ['rate<0.3'],     // Error rate should be less than 30% for stress test
    errors: ['rate<0.3'],              // Custom error rate should be less than 30%
  },
};

// Environment variable to choose API
const API_TYPE = __ENV.API_TYPE || 'nodejs'; // 'nodejs' or 'golang'
const BASE_URL = API_TYPE === 'golang' ? 'http://localhost:3001' : 'http://localhost:3000';

const testTodos = [
  { title: 'Stress Test Todo 1', description: 'High load description 1' },
  { title: 'Stress Test Todo 2', description: 'High load description 2' },
  { title: 'Stress Test Todo 3', description: 'High load description 3' },
  { title: 'Stress Test Todo 4', description: 'High load description 4' },
  { title: 'Stress Test Todo 5', description: 'High load description 5' },
];

export function setup() {
  console.log(`Starting stress test for ${API_TYPE.toUpperCase()} API`);
  console.log(`Base URL: ${BASE_URL}`);
  
  // Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'Health check successful': (r) => r.status === 200,
  });
  
  return { baseUrl: BASE_URL, apiType: API_TYPE };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  
  // More aggressive test patterns for stress testing
  const scenarios = [
    { name: 'getTodos', weight: 50 },    // Increased read operations
    { name: 'createTodo', weight: 30 },  // More creates
    { name: 'updateTodo', weight: 15 },  // Some updates
    { name: 'deleteTodo', weight: 5 },   // Fewer deletes to maintain data
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
  
  // Reduced sleep time for stress testing
  sleep(Math.random() * 0.5); // Random sleep between 0-500ms
}

function testGetTodos(baseUrl) {
  const response = http.get(`${baseUrl}/api/todos`);
  
  const success = check(response, {
    'GET /api/todos status is 200': (r) => r.status === 200,
    'GET /api/todos response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
}

function testCreateTodo(baseUrl) {
  const todo = testTodos[Math.floor(Math.random() * testTodos.length)];
  const payload = {
    title: `${todo.title} - ${Date.now()} - ${Math.random()}`,
    description: todo.description,
    completed: Math.random() > 0.5,
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.post(`${baseUrl}/api/todos`, JSON.stringify(payload), params);
  
  const success = check(response, {
    'POST /api/todos status is 201': (r) => r.status === 201,
    'POST /api/todos response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  
  if (success && response.status === 201) {
    const createdTodo = JSON.parse(response.body);
    return createdTodo.id;
  }
  
  return null;
}

function testUpdateTodo(baseUrl) {
  const getTodosResponse = http.get(`${baseUrl}/api/todos`);
  
  if (getTodosResponse.status !== 200) {
    errorRate.add(true);
    return;
  }
  
  const todos = JSON.parse(getTodosResponse.body);
  
  if (todos.length === 0) {
    // Create a todo first
    const todoId = testCreateTodo(baseUrl);
    if (!todoId) {
      errorRate.add(true);
      return;
    }
    return; // Exit early, don't update in the same iteration
  }
  
  const randomTodo = todos[Math.floor(Math.random() * todos.length)];
  const updatePayload = {
    title: `Stress Updated - ${Date.now()}`,
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
    'PUT /api/todos/:id response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
}

function testDeleteTodo(baseUrl) {
  // Get existing todos first
  const getTodosResponse = http.get(`${baseUrl}/api/todos`);
  
  if (getTodosResponse.status !== 200) {
    errorRate.add(true);
    return;
  }
  
  const todos = JSON.parse(getTodosResponse.body);
  
  if (todos.length === 0) {
    // No todos to delete
    return;
  }
  
  // Delete a random todo
  const randomTodo = todos[Math.floor(Math.random() * todos.length)];
  const response = http.del(`${baseUrl}/api/todos/${randomTodo.id}`);
  
  const success = check(response, {
    'DELETE /api/todos/:id status is 204 or 404': (r) => r.status === 204 || r.status === 404,
    'DELETE /api/todos/:id response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
}

export function teardown(data) {
  console.log(`Stress test completed for ${data.apiType.toUpperCase()} API`);
}