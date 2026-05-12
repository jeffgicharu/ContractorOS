import { test, expect } from '@playwright/test';
import { LIVE_DEMO_ADMIN } from '../fixtures/auth';

test('live: alice@demo admin login lands on /dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(LIVE_DEMO_ADMIN.email);
  await page.getByLabel('Password').fill(LIVE_DEMO_ADMIN.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL(/\/dashboard$/, { timeout: 20_000 });
  await expect(page.locator('body')).toContainText(/dashboard|welcome|contractor|engagement/i);
});
