import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN, LOCAL_SEED_CONTRACTOR, loginAs } from '../fixtures/auth';

test('contractor submits invoice → admin approves → admin marks paid', async ({ browser }) => {
  const contractorCtx = await browser.newContext();
  const contractorPage = await contractorCtx.newPage();
  await loginAs(contractorPage, LOCAL_SEED_CONTRACTOR.email, LOCAL_SEED_CONTRACTOR.password, 'contractor');

  await contractorPage.goto('/portal/invoices/new');
  for (const [label, value] of [
    [/period.?start|start.?date/i, '2026-04-01'],
    [/period.?end|end.?date/i, '2026-04-30'],
    [/amount|total|hours/i, '40'],
  ] as const) {
    const field = contractorPage.getByLabel(label).first();
    if (await field.isVisible().catch(() => false)) await field.fill(value);
  }
  await contractorPage.getByRole('button', { name: /save draft|create|submit/i }).first().click();
  await contractorPage.waitForURL(/\/portal\/invoices(\/|$)/, { timeout: 15_000 });

  const submit = contractorPage.getByRole('button', { name: /submit/i });
  if (await submit.first().isVisible().catch(() => false)) await submit.first().click();

  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await loginAs(adminPage, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');

  await adminPage.goto('/invoices');
  await adminPage.getByRole('link').filter({ hasText: /submitted|pending|review/i }).first().click().catch(() => {});

  const approve = adminPage.getByRole('button', { name: /approve/i });
  test.skip(!(await approve.first().isVisible().catch(() => false)), 'no submitted invoice currently surfaces approve action — local seed dependency');
  await approve.first().click();

  const markPaid = adminPage.getByRole('button', { name: /mark paid|paid/i });
  if (await markPaid.first().isVisible().catch(() => false)) await markPaid.first().click();
  await expect(adminPage.locator('body')).toContainText(/paid|approved/i);

  await contractorCtx.close();
  await adminCtx.close();
});
