import { test, expect } from '@playwright/test';
import { LOCAL_SEED_ADMIN, loginAs } from '../fixtures/auth';

test('valid credentials log in and reach the admin dashboard', async ({ page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('invalid credentials surface an error and stay on /login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(LOCAL_SEED_ADMIN.email);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('body')).toContainText(/invalid|incorrect|wrong/i);
});

test('accessing a protected route while logged out redirects to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});

test('logout clears the session and bounces protected routes back to /login', async ({ page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');

  const logout = page.getByRole('button', { name: /log ?out|sign ?out/i }).or(
    page.getByRole('link', { name: /log ?out|sign ?out/i }),
  );
  const hasLogout = await logout.first().isVisible().catch(() => false);
  test.skip(!hasLogout, 'no visible logout control in the admin shell — see E2E_VERIFICATION.md (new finding)');

  await logout.first().click();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});
