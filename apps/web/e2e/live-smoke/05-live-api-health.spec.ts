import { test, expect } from '@playwright/test';

test('live: /api/v1/health returns 200 with healthy body', async ({ request }) => {
  const r = await request.get('https://contractoros.jeffgicharu.com/api/v1/health', {
    failOnStatusCode: false,
  });
  expect(r.status()).toBe(200);
  const body = await r.json().catch(() => null);
  // We accept any 2xx body shape that includes a positive signal.
  const text = JSON.stringify(body ?? {});
  expect.soft(text).toMatch(/ok|up|healthy|alive|status/i);
});

test('live: unauthenticated requests to admin API return 401', async ({ request }) => {
  const r = await request.get('https://contractoros.jeffgicharu.com/api/v1/contractors', {
    failOnStatusCode: false,
  });
  expect(r.status()).toBe(401);
});
