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

test('admin shell exposes a visible logout that clears the session', async ({ page }) => {
  await loginAs(page, LOCAL_SEED_ADMIN.email, LOCAL_SEED_ADMIN.password, 'admin');

  // The user menu lives in the right-hand corner of the admin header.
  // Open it and click the explicit "Log out" item.
  await page.getByRole('button', { name: /account menu/i }).click();
  const logoutItem = page.getByRole('menuitem', { name: /log out/i });
  await expect(logoutItem).toBeVisible();
  await logoutItem.click();

  // Land on /login.
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

  // And a subsequent attempt to reach a protected route bounces back.
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});
