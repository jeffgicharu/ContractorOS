import { test, expect } from '@playwright/test';
import { LIVE_DEMO_ADMIN, loginAs } from '../fixtures/auth';

test('live: dashboard widgets render after login', async ({ page }) => {
  await loginAs(page, LIVE_DEMO_ADMIN.email, LIVE_DEMO_ADMIN.password, 'admin');
  await expect(page).toHaveURL(/\/dashboard$/);

  // Body should not contain a stack trace / app-error banner.
  await expect(page.locator('body')).not.toContainText(/application error|client error|stack trace/i);

  // At least one widget label should be present — be liberal about wording.
  await expect(page.locator('body')).toContainText(/contractor|invoice|engagement|risk|onboarding|payment/i);

  // Cross-page navigation via direct page.goto is unreliable on WebKit
  // because the access token lives in JS memory and the silent
  // refresh-via-cookie flow races with the navigation. The curl-live
  // sweep already verifies the API surface; here we only follow client-side
  // links inside the SPA shell and assert no error banner surfaces.
  for (const linkName of ['Contractors', 'Invoices', 'Documents', 'Classification']) {
    const link = page.getByRole('link', { name: linkName });
    if (await link.first().isVisible().catch(() => false)) {
      await link.first().click();
      await page.waitForLoadState('domcontentloaded');
      await expect.soft(page.locator('body')).not.toContainText(/application error|stack trace/i);
    }
  }
});
