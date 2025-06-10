import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 100 },  // Spike to 100 users in 10 seconds
    { duration: '1m', target: 100 },   // Stay at 100 users for 1 minute
    { duration: '10s', target: 1400 }, // Spike to 1400 users in 10 seconds
    { duration: '3m', target: 1400 },  // Stay at 1400 users for 3 minutes
    { duration: '10s', target: 100 },  // Drop back to 100 users in 10 seconds
    { duration: '3m', target: 100 },   // Stay at 100 users for 3 minutes
    { duration: '10s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% of requests should be below 2000ms
    http_req_failed: ['rate<0.5'],     // Error rate should be less than 50% for spike test
    errors: ['rate<0.5'],              // Custom error rate should be less than 50%
  },
};

// Environment variable to choose API
const API_TYPE = __ENV.API_TYPE || 'nodejs'; // 'nodejs' or 'golang'
const BASE_URL = API_TYPE === 'golang' ? 'http://localhost:3001' : 'http://localhost:3000';

const testTodos = [
  { title: 'Spike Test Todo 1', description: 'Sudden load description 1' },
  { title: 'Spike Test Todo 2', description: 'Sudden load description 2' },
  { title: 'Spike Test Todo 3', description: 'Sudden load description 3' },
];

export function setup() {
  console.log(`Starting spike test for ${API_TYPE.toUpperCase()} API`);
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
  
  // Simple read-heavy workload for spike testing
  const scenarios = [
    { name: 'getTodos', weight: 70 },    // Mostly reads during spike
    { name: 'createTodo', weight: 20 },  // Some creates
    { name: 'updateTodo', weight: 10 },  // Few updates
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
  }
  
  // Very short sleep for spike testing
  sleep(Math.random() * 0.1); // Random sleep between 0-100ms
}

function testGetTodos(baseUrl) {
  const response = http.get(`${baseUrl}/api/todos`);
  
  const success = check(response, {
    'GET /api/todos status is 200': (r) => r.status === 200,
    'GET /api/todos response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
}

function testCreateTodo(baseUrl) {
  const todo = testTodos[Math.floor(Math.random() * testTodos.length)];
  const payload = {
    title: `${todo.title} - ${Date.now()} - ${Math.random()}`,
    description: todo.description,
    completed: false,
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '2s', // Shorter timeout for spike test
  };
  
  const response = http.post(`${baseUrl}/api/todos`, JSON.stringify(payload), params);
  
  const success = check(response, {
    'POST /api/todos status is 201': (r) => r.status === 201,
    'POST /api/todos response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
}

function testUpdateTodo(baseUrl) {
  const getTodosResponse = http.get(`${baseUrl}/api/todos`, {
    timeout: '2s',
  });
  
  if (getTodosResponse.status !== 200) {
    errorRate.add(true);
    return;
  }
  
  const todos = JSON.parse(getTodosResponse.body);
  
  if (todos.length === 0) {
    return; // No todos to update
  }
  
  const randomTodo = todos[Math.floor(Math.random() * todos.length)];
  const updatePayload = {
    title: `Spike Updated - ${Date.now()}`,
    completed: !randomTodo.completed,
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '2s',
  };
  
  const response = http.put(`${baseUrl}/api/todos/${randomTodo.id}`, JSON.stringify(updatePayload), params);
  
  const success = check(response, {
    'PUT /api/todos/:id response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
}

export function teardown(data) {
  console.log(`Spike test completed for ${data.apiType.toUpperCase()} API`);
}