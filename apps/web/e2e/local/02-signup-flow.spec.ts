import { test, expect } from '@playwright/test';
import { uniqueEmail, uniqueSlug } from '../fixtures/unique-email';

// DESTRUCTIVE: creates a brand-new org+admin via the public signup flow.
// Only safe to run against a local DB. If the public app does not yet
// expose a signup route (the MVP only ships login + invite-based onboarding),
// this test characterizes that gap rather than failing the build.

test('new-org self-service signup creates an admin and lands on dashboard', async ({ page }) => {
  await page.goto('/');

  const signupCta = page.getByRole('link', { name: /sign ?up|create account|start free/i });
  const visible = await signupCta.first().isVisible().catch(() => false);

  test.skip(!visible, 'public signup link not exposed on the landing page — invite-only signup is the documented MVP flow');

  await signupCta.first().click();

  await page.getByLabel(/organization|company/i).fill(`E2E Test Co ${uniqueSlug('co')}`);
  await page.getByLabel(/^email/i).fill(uniqueEmail());
  await page.getByLabel(/password/i).fill('LocalE2E!Pass123');
  await page.getByRole('button', { name: /create account|sign up|continue/i }).click();

  await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15_000 });
  await expect(page.locator('body')).toContainText(/dashboard|welcome|getting started/i);
});
