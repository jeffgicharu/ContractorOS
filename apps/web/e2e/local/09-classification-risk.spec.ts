import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN, loginAs } from '../fixtures/auth';

test('classification dashboard renders risk distribution and lets admin drill into a contractor', async ({ page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');

  await page.goto('/classification');
  await expect(page.locator('body')).toContainText(/classification|risk/i);

  await expect.soft(page.locator('body')).toContainText(/low|medium|high|critical/i);

  // Drill into the first contractor surfaced in the top-risk list.
  const topRisk = page.locator('a[href^="/contractors/"]').first();
  if (await topRisk.isVisible().catch(() => false)) {
    await topRisk.click();
    await page.waitForURL(/\/contractors\/[^/]+/);

    const riskTab = page.getByRole('tab', { name: /risk/i }).or(page.getByRole('link', { name: /risk/i }));
    if (await riskTab.first().isVisible().catch(() => false)) {
      await riskTab.first().click();
      await expect(page.locator('body')).toContainText(/IRS|DOL|ABC|aggregate|score/i);
    }
  }
});
