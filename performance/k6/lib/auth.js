import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';
export const PERF_ADMIN_EMAIL = __ENV.PERF_ADMIN_EMAIL || 'admin@perf.test';
export const PERF_ADMIN_PASSWORD = __ENV.PERF_ADMIN_PASSWORD || 'Password1';

/**
 * Log the perf admin in once per VU (called from setup() at the start of
 * each test) and return an Authorization header value plus the user id.
 *
 * Calling once per VU rather than per iteration keeps the perf test
 * focused on the endpoint under measurement instead of the auth pipeline.
 */
export function login(email = PERF_ADMIN_EMAIL, password = PERF_ADMIN_PASSWORD) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'auth' },
    },
  );
  check(res, {
    'login 200': (r) => r.status === 200,
    'login returned access token': (r) => r.json('data.accessToken') !== '',
  });
  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${res.body}`);
  }
  const token = res.json('data.accessToken');
  return {
    authHeader: { Authorization: `Bearer ${token}` },
    user: res.json('data.user'),
  };
}
