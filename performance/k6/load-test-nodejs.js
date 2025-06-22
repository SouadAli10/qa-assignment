import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 20 },  
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 }, 
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should complete in <500ms
    http_req_failed: ['rate<0.05'],     // Request failure rate <5%
    errors: ['rate<0.05'],              // Custom error rate <5%
  },
};

const BASE_URL = 'http://localhost:3000';

// Shared variables using a global object
let vuData = {};

export function setup() {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'API is healthy': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  // Initialize VU data
  return { todos: [] };
}

export default function (data) {
  // Initialize VU-specific data if it doesn't exist
  if (!vuData[__VU]) {
    vuData[__VU] = { todoId: null };
  }

  // Execute test scenarios with weighted probability
  const rand = Math.random();
  if (rand < 0.4) {
    testGetTodos();
  } else if (rand < 0.7) {
    testCreateTodo();
  } else if (rand < 0.9) {
    testUpdateTodo();
  } else {
    testDeleteTodo();
  }

  sleep(1);
}

function testGetTodos() {
  const params = {
    page: Math.floor(Math.random() * 3) + 1,
    per_page: Math.random() > 0.5 ? 10 : 20,
    sort: Math.random() > 0.5 ? 'created_at' : 'title',
    order: Math.random() > 0.5 ? 'asc' : 'desc',
  };

  const res = http.get(`${BASE_URL}/api/todos`, { params });

  check(res, {
    'GET /todos status is 200': (r) => r.status === 200,
    'GET /todos returns paginated response': (r) => {
      const body = JSON.parse(r.body);
      return body.data && typeof body.total === 'number';
    },
  }) || errorRate.add(1);
}

function testCreateTodo() {
  const todoData = {
    title: `Test Todo ${uuidv4()}`,
    description: Math.random() > 0.3 ? `Description ${uuidv4()}` : undefined,
    completed: Math.random() > 0.5,
  };

  const res = http.post(
    `${BASE_URL}/api/todos`,
    JSON.stringify(todoData),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const success = check(res, {
    'POST /todos status is 201': (r) => r.status === 201,
    'POST /todos returns created todo': (r) => {
      const body = JSON.parse(r.body);
      vuData[__VU].todoId = body.id;
      return body.title === todoData.title;
    },
  });

  if (!success) {
    errorRate.add(1);
  }
}

function testUpdateTodo() {
  // Use previously created todo or create new one if needed
  if (!vuData[__VU].todoId) {
    testCreateTodo();
    if (!vuData[__VU].todoId) return;
  }

  const updateData = {
    title: `Updated Todo ${uuidv4()}`,
    completed: Math.random() > 0.5,
    description: Math.random() > 0.3 ? `Updated Desc ${uuidv4()}` : null,
  };

  const res = http.put(
    `${BASE_URL}/api/todos/${vuData[__VU].todoId}`,
    JSON.stringify(updateData),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'PUT /todos/:id status is 200': (r) => r.status === 200,
    'PUT /todos/:id updates todo': (r) => {
      const body = JSON.parse(r.body);
      return body.title === updateData.title;
    },
  }) || errorRate.add(1);
}

function testDeleteTodo() {
  if (!vuData[__VU].todoId) {
    testCreateTodo();
    if (!vuData[__VU].todoId) return;
  }

  const res = http.del(`${BASE_URL}/api/todos/${vuData[__VU].todoId}`);

  const success = check(res, {
    'DELETE /todos/:id status is 204': (r) => r.status === 204,
  });

  if (success) {
    vuData[__VU].todoId = null;
  } else {
    errorRate.add(1);
  }
}

export function teardown() {
  // Clean up any remaining todos
  for (const vu in vuData) {
    if (vuData[vu].todoId) {
      http.del(`${BASE_URL}/api/todos/${vuData[vu].todoId}`);
    }
  }
}