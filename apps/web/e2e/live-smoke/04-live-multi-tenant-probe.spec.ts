import { test, expect } from '@playwright/test';
import { LIVE_DEMO_ADMIN } from '../fixtures/auth';

// Read-only multi-tenant probe. We log in as alice (Demo Co) via the API
// and attempt to read random UUIDs from inside bob's org. The expected
// API response is 404 / 403; anything that returns 200 with real
// Other-Org data is a SEV-1 isolation bug.

const FOREIGN_UUIDS = [
  '00000000-0000-4000-8000-aaaaaaaaaaaa',
  '11111111-2222-4333-8444-555555555555',
];

const RESOURCE_PATHS = [
  '/contractors',
  '/invoices',
  '/offboarding',
];

test('live: alice cannot read foreign-org resources via API URL guessing', async ({ request }) => {
  // Log in as alice and capture the JWT.
  const login = await request.post('https://contractoros.jeffgicharu.com/api/v1/auth/login', {
    data: { email: LIVE_DEMO_ADMIN.email, password: LIVE_DEMO_ADMIN.password },
  });
  expect(login.ok(), 'alice should be able to log in').toBeTruthy();
  const { data } = await login.json();
  const token = data.accessToken as string;
  expect(token, 'access token should be present').toBeTruthy();

  for (const id of FOREIGN_UUIDS) {
    for (const base of RESOURCE_PATHS) {
      const target = `https://contractoros.jeffgicharu.com/api/v1${base}/${id}`;
      const resp = await request.get(target, {
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
      const status = resp.status();
      // Acceptable: 403 (forbidden), 404 (not found). Bad: 200 (data leak), 500 (crash).
      expect.soft([403, 404]).toContain(status);
      expect.soft(status, `${target} returned ${status}`).not.toBe(200);
    }
  }
});
