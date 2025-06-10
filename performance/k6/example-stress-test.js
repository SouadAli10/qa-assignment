import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress test configuration - gradually increase load until system breaks
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Below normal load
    { duration: '5m', target: 50 },   // Normal load
    { duration: '2m', target: 100 },  // Around breaking point
    { duration: '5m', target: 100 },  // At breaking point
    { duration: '2m', target: 200 },  // Beyond breaking point
    { duration: '5m', target: 200 },  // Stay at high load
    { duration: '5m', target: 0 },    // Scale down - recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Relaxed for stress test
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';

export default function () {
  // Simple endpoint to stress test
  const res = http.get(`${BASE_URL}/todos`, {
    headers: {
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN || 'test-token'}`,
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}