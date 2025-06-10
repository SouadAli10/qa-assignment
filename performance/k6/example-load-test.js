import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom error rate metric
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.01'],                  // Error rate under 1%
    errors: ['rate<0.01'],                           // Custom error rate under 1%
  },
};

// Test data
const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';
const TEST_USER = {
  email: `user_${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

// Setup: Create test user and get auth token
export function setup() {
  // Register user
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify(TEST_USER), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(registerRes, {
    'registration successful': (r) => r.status === 201,
  });

  // Login to get token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(TEST_USER), {
    headers: { 'Content-Type': 'application/json' },
  });

  const authToken = loginRes.json('token');
  
  return { authToken, userId: loginRes.json('user.id') };
}

// Main test scenario
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.authToken}`,
  };

  // Scenario: User creates and manages todos
  
  // 1. Create a category
  const categoryPayload = {
    name: `Work ${Date.now()}`,
    color: '#FF5733',
  };
  
  const createCategoryRes = http.post(
    `${BASE_URL}/categories`,
    JSON.stringify(categoryPayload),
    { headers }
  );
  
  const success = check(createCategoryRes, {
    'category created': (r) => r.status === 201,
  });
  
  errorRate.add(!success);
  
  if (!success) return;
  
  const categoryId = createCategoryRes.json('id');
  
  // 2. Create todos
  for (let i = 0; i < 3; i++) {
    const todoPayload = {
      title: `Task ${i + 1} - ${Date.now()}`,
      description: 'This is a test todo item',
      categoryId: categoryId,
      priority: ['high', 'medium', 'low'][i % 3],
      dueDate: new Date(Date.now() + 86400000 * (i + 1)).toISOString(),
    };
    
    const createTodoRes = http.post(
      `${BASE_URL}/todos`,
      JSON.stringify(todoPayload),
      { headers }
    );
    
    const todoSuccess = check(createTodoRes, {
      'todo created': (r) => r.status === 201,
      'todo has id': (r) => r.json('id') !== undefined,
    });
    
    errorRate.add(!todoSuccess);
    
    sleep(0.5); // Think time between operations
  }
  
  // 3. List todos with pagination
  const listTodosRes = http.get(`${BASE_URL}/todos?limit=10&offset=0`, { headers });
  
  check(listTodosRes, {
    'todos retrieved': (r) => r.status === 200,
    'todos is array': (r) => Array.isArray(r.json('data')),
    'pagination info present': (r) => r.json('total') !== undefined,
  });
  
  // 4. Get todos by category
  const categoryTodosRes = http.get(
    `${BASE_URL}/todos/category/${categoryId}`,
    { headers }
  );
  
  check(categoryTodosRes, {
    'category todos retrieved': (r) => r.status === 200,
  });
  
  // 5. Search todos
  const searchRes = http.get(`${BASE_URL}/todos/search?q=Task`, { headers });
  
  check(searchRes, {
    'search successful': (r) => r.status === 200,
    'search returns results': (r) => r.json('data').length > 0,
  });
  
  sleep(1); // Think time between user actions
}

// Cleanup
export function teardown(data) {
  // In a real test, you might want to delete test data
  console.log('Test completed');
}