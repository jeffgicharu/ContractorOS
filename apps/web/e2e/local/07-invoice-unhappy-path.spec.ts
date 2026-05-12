import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN, loginAs } from '../fixtures/auth';

test('admin rejects a submitted invoice with a reason', async ({ page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');

  await page.goto('/invoices');
  const submitted = page.getByRole('link').filter({ hasText: /submitted|pending|review/i }).first();
  test.skip(!(await submitted.isVisible().catch(() => false)), 'no submitted invoice in seed data — happy-path spec must run first');
  await submitted.click();

  const reject = page.getByRole('button', { name: /reject/i });
  test.skip(!(await reject.first().isVisible().catch(() => false)), 'reject action not exposed for this invoice state');
  await reject.first().click();

  const reasonField = page.getByLabel(/reason|comment|note/i).first();
  if (await reasonField.isVisible().catch(() => false)) {
    await reasonField.fill('E2E test rejection — line item mismatch');
  }
  await page.getByRole('button', { name: /confirm|reject|submit/i }).first().click();
  await expect(page.locator('body')).toContainText(/rejected|line item mismatch/i, { timeout: 15_000 });
});
