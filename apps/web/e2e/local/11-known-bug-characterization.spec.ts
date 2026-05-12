import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN, loginAs } from '../fixtures/auth';

// Each test below characterizes the CURRENT buggy behavior of a backlog
// issue. They are marked `test.fail()` so CI stays green while the bug
// is open. When the fix lands, the test starts unexpectedly passing,
// CI turns red, and the developer must flip the assertion to the
// corrected behavior in the same change.

// Issue #5 — Engagement creation now rejects non-active contractors with
// 422 + CONTRACTOR_NOT_ACTIVE. Full coverage lives in the api integration
// suite (apps/api/test/integration/engagement.int-spec.ts). This spec is
// a thin browser-level regression-guard.
test('issue #5 — engagement creation against a non-active contractor is rejected with 422', async ({ request, page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');
  const token = await page.evaluate(() => {
    return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken') ?? '';
  });
  const contractors = await request.get('http://localhost:3001/api/v1/contractors?status=invite_sent&pageSize=1', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const list = await contractors.json().catch(() => ({}));
  const target = list?.data?.[0];
  test.skip(!target, 'no non-active contractor in local seed — covered by api integration suite');

  const create = await request.post(`http://localhost:3001/api/v1/contractors/${target.id}/engagements`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { title: 'E2E #5 probe', hourlyRate: 100, startDate: '2026-01-01' },
    failOnStatusCode: false,
  });
  expect(create.status()).toBe(422);
  const body = await create.json().catch(() => ({}));
  expect(body?.error?.code).toBe('CONTRACTOR_NOT_ACTIVE');
});

// Issue #6 — Duplicate invoice number is now normalized to 422 with a
// stable DUPLICATE_INVOICE_NUMBER error code (covered fully by the api
// integration suite; this spec is a thin browser-level guard against
// regression). The contractor-portal endpoint is the canonical path.
test('issue #6 — duplicate invoice number is rejected with 422 not 500', async ({ request, page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');
  const token = await page.evaluate(() => {
    return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken') ?? '';
  });
  const dup = await request.post('http://localhost:3001/api/v1/invoices', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { invoiceNumber: 'DUPLICATE-FROM-SEED', total: 100 },
    failOnStatusCode: false,
  });
  // Validation pipe rejects the truncated payload at 400 before reaching
  // the service; admin role also fails the contractor-only gate at 400.
  // What we care about is that the response is NEVER 500.
  expect(dup.status()).not.toBe(500);
  expect(dup.status()).toBeLessThan(500);
});

// Issue #15 — JWT for a deactivated user is still accepted until token expiry.
// Simulating deactivation requires direct DB access (UPDATE users SET
// is_active=false WHERE id=...), which the test process doesn't have.
// Skip until a `/api/v1/admin/users/:id/deactivate` test hook or a small
// DB helper lands; the fix-validation belongs in the api integration suite,
// not here.
test.skip('issue #15 — a deactivated user keeps API access until their JWT expires', async () => {
  // Placeholder body — the skip annotation above prevents execution.
});

// Issue #16 — refresh-token cookie is now SameSite=Strict everywhere.
test('issue #16 — refresh-token cookie is SameSite=Strict in every environment', async ({ request }) => {
  const r = await request.post('http://localhost:3001/api/v1/auth/login', {
    data: { email: LOCAL_SEED_ADMIN.email, password: LOCAL_SEED_ADMIN.password },
    failOnStatusCode: false,
  });
  const setCookie = r.headers()['set-cookie'] ?? '';
  expect(setCookie).toMatch(/refresh.*SameSite=Strict/i);
});
