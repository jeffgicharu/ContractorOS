import { test, expect } from '@playwright/test';
import { LIVE_DEMO_ADMIN } from '../fixtures/auth';

// Read-only characterization of open backlog bugs against the LIVE
// deployment. Anything destructive (creating engagements with bad state,
// duplicate-invoice probes, etc.) is reserved for the local suite. Here
// we only verify the few invariants that can be observed without
// mutating real data.

// Issue #16 — refresh-token cookie SameSite= attribute. On the live
// deployment the cookie is already SameSite=Strict (likely a hotfix
// applied directly to the VPS); the backlog issue tracks aligning the
// local default. This test characterizes the LIVE state — no test.fail()
// — and the local characterization in 11-known-bug-characterization
// continues to track the unfixed local behavior. The local/live
// divergence itself is documented in E2E_VERIFICATION.md.
test('live issue #16 — refresh-token cookie is SameSite=Strict on the live deployment', async ({ request }) => {
  const r = await request.post('https://contractoros.jeffgicharu.com/api/v1/auth/login', {
    data: { email: LIVE_DEMO_ADMIN.email, password: LIVE_DEMO_ADMIN.password },
    failOnStatusCode: false,
  });
  const setCookie = r.headers()['set-cookie'] ?? '';
  expect(setCookie).toMatch(/refresh.*SameSite=Strict/i);
});

// Issue #14 — public-facing posture only: confirm /api/v1/health does
// NOT expose dependency / version metadata that the dependency-CVE
// advisories would attach to. Today the body is permissive.
test.fail('live issue #14 — /health response should not leak server version metadata', async ({ request }) => {
  const r = await request.get('https://contractoros.jeffgicharu.com/api/v1/health', {
    failOnStatusCode: false,
  });
  const headers = r.headers();
  // Today there is no `X-Powered-By` stripping. After the fix this should pass.
  expect(headers['x-powered-by']).toBeUndefined();
});
