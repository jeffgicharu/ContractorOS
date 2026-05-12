import { test, expect } from '@playwright/test';
import { LIVE_DEMO_ADMIN, loginAs } from '../fixtures/auth';

test('live: dashboard widgets render after login', async ({ page }) => {
  await loginAs(page, LIVE_DEMO_ADMIN.email, LIVE_DEMO_ADMIN.password, 'admin');
  await expect(page).toHaveURL(/\/dashboard$/);

  // Body should not contain a stack trace / app-error banner.
  await expect(page.locator('body')).not.toContainText(/application error|client error|stack trace/i);

  // At least one widget label should be present — be liberal about wording.
  await expect(page.locator('body')).toContainText(/contractor|invoice|engagement|risk|onboarding|payment/i);

  // Navigate to the core sub-pages and confirm 2xx on each.
  for (const path of ['/contractors', '/invoices', '/documents', '/classification']) {
    const resp = await page.goto(path);
    expect.soft(resp?.status(), `${path} should be < 400`).toBeLessThan(400);
    await expect.soft(page.locator('body')).not.toContainText(/application error|stack trace/i);
  }
});
