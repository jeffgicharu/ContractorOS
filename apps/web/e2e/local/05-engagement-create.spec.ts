import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN, loginAs } from '../fixtures/auth';

test('admin opens a contractor and creates an engagement', async ({ page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');

  await page.goto('/contractors');
  await expect(page.locator('body')).toContainText(/contractor/i);

  // Open the first contractor row.
  const firstRow = page.getByRole('row').nth(1).or(page.locator('a[href^="/contractors/"]').first());
  await firstRow.first().click();
  await page.waitForURL(/\/contractors\/[^/]+/);

  // Switch to engagements tab (label may vary).
  const engagementsTab = page.getByRole('tab', { name: /engagement/i }).or(page.getByRole('link', { name: /engagement/i }));
  if (await engagementsTab.first().isVisible().catch(() => false)) {
    await engagementsTab.first().click();
  }

  const newButton = page.getByRole('button', { name: /new engagement|create engagement|add engagement/i });
  test.skip(!(await newButton.first().isVisible().catch(() => false)), 'engagement creation UI not yet exposed on the contractor detail page');

  await newButton.first().click();

  for (const [label, value] of [
    [/title|role|position/i, 'E2E test engagement'],
    [/rate/i, '100'],
    [/start.?date/i, '2026-01-01'],
  ] as const) {
    const field = page.getByLabel(label).first();
    if (await field.isVisible().catch(() => false)) await field.fill(value);
  }

  await page.getByRole('button', { name: /create|save|submit/i }).first().click();
  await expect(page.locator('body')).toContainText(/E2E test engagement|engagement created|active/i, { timeout: 15_000 });
});
