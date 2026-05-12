import { test, expect, devices } from '@playwright/test';
import { LOCAL_SEED_ADMIN, loginAs } from '../fixtures/auth';

test.use({ ...devices['Pixel 5'] });

test('mobile viewport: login + dashboard render without layout overflow', async ({ page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');

  await expect(page).toHaveURL(/\/dashboard$/);

  // No horizontal scrollbar.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'horizontal overflow on mobile dashboard').toBeLessThanOrEqual(1);

  // Sidebar should be collapsed or replaced by a hamburger menu.
  const hamburger = page.getByRole('button', { name: /menu|navigation/i });
  if (await hamburger.first().isVisible().catch(() => false)) {
    await hamburger.first().click();
  }

  await page.goto('/contractors');
  await expect(page.locator('body')).toContainText(/contractor/i);
});
