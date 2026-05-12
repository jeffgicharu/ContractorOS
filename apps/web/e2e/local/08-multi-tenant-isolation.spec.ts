import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN } from '../fixtures/auth';

const RESOURCE_PATHS = [
  '/contractors',
  '/invoices',
  '/documents',
  '/offboarding',
];

const FAKE_UUIDS = [
  '00000000-0000-4000-8000-deadbeefdead',
  '11111111-2222-4333-8444-555555555555',
];

test('admin probing foreign UUIDs via the API gets 404, never 200 with real data', async ({ request }) => {
  const login = await request.post('http://localhost:3001/api/v1/auth/login', {
    data: { email: LOCAL_SEED_ADMIN.email, password: LOCAL_SEED_ADMIN.password },
  });
  expect(login.ok()).toBeTruthy();
  const { data } = await login.json();
  const token = data.accessToken as string;

  for (const id of FAKE_UUIDS) {
    for (const base of RESOURCE_PATHS) {
      const r = await request.get(`http://localhost:3001/api/v1${base}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
      const status = r.status();
      // Acceptable: 403, 404. Bad: 200 (data leak), 5xx (crash).
      expect.soft([403, 404]).toContain(status);
      expect.soft(status, `${base}/${id}`).not.toBe(200);
    }
  }
});

test('unauthenticated requests to admin API return 401', async ({ request }) => {
  const r = await request.get('http://localhost:3001/api/v1/contractors', { failOnStatusCode: false });
  expect(r.status()).toBe(401);
});
