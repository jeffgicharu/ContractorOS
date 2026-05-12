import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN, loginAs } from '../fixtures/auth';

// Each test below characterizes the CURRENT buggy behavior of a backlog
// issue. They are marked `test.fail()` so CI stays green while the bug
// is open. When the fix lands, the test starts unexpectedly passing,
// CI turns red, and the developer must flip the assertion to the
// corrected behavior in the same change.

// Issue #5 — Engagement creation does not validate contractor active status.
// The fix is to reject engagement creation against non-active contractors
// with a 4xx. Today the api accepts it. The local-suite cannot reliably
// trigger this without seed manipulation, so we hit the api directly.
test.fail('issue #5 — engagement creation against a non-active contractor still succeeds', async ({ request, page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');
  const token = await page.evaluate(() => {
    return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken') ?? '';
  });
  const contractors = await request.get('http://localhost:3001/api/v1/contractors?status=invite_sent&pageSize=1', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const list = await contractors.json().catch(() => ({}));
  const target = list?.data?.[0];
  test.skip(!target, 'no non-active contractor in local seed — issue #5 characterization needs seed data');

  const create = await request.post('http://localhost:3001/api/v1/engagements', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { contractorId: target.id, title: 'E2E #5 probe', hourlyRate: 100, startDate: '2026-01-01' },
    failOnStatusCode: false,
  });
  // The fix should make this 422; today it returns 201.
  expect(create.status()).toBe(422);
});

// Issue #6 — Duplicate invoice number returns 500 instead of 422.
test.fail('issue #6 — duplicate invoice number returns 500 instead of 422', async ({ request, page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');
  const token = await page.evaluate(() => {
    return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken') ?? '';
  });
  const dup = await request.post('http://localhost:3001/api/v1/invoices', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { invoiceNumber: 'DUPLICATE-FROM-SEED', total: 100 },
    failOnStatusCode: false,
  });
  // The fix should normalize unique-violation to 422; today it bubbles a 500.
  expect(dup.status()).toBe(422);
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

// Issue #16 — refresh-token cookie uses SameSite=Lax; Strict is preferred.
test.fail('issue #16 — refresh-token cookie should be SameSite=Strict', async ({ request }) => {
  const r = await request.post('http://localhost:3001/api/v1/auth/login', {
    data: { email: LOCAL_SEED_ADMIN.email, password: LOCAL_SEED_ADMIN.password },
    failOnStatusCode: false,
  });
  const setCookie = r.headers()['set-cookie'] ?? '';
  expect(setCookie).toMatch(/refresh.*SameSite=Strict/i);
});
