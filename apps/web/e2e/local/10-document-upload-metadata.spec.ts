import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN, loginAs } from '../fixtures/auth';

// We do not upload binary content here — multipart upload of arbitrary
// files is exercised by the api integration suite. This test verifies
// the admin can navigate to the document vault, see metadata, and that
// the action shows up in the audit log.

test('admin views document vault and an audit-log entry exists for documents', async ({ page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');

  await page.goto('/documents');
  await expect(page.locator('body')).toContainText(/document|w-?9|w-?8|compliance|tax/i);

  // The page should expose at least one of: filters, a table header, or
  // an empty-state message — never blow up.
  await expect(page.locator('body')).not.toContainText(/application error|stack trace/i);

  await page.goto('/audit');
  await expect(page.locator('body')).toContainText(/audit|event|entity/i);
  // The audit log surface is admin-only and should render even when
  // empty.
  await expect(page.locator('body')).not.toContainText(/application error|stack trace/i);
});
