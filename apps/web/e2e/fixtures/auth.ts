import type { Page } from '@playwright/test';

/**
 * Logs in via the UI. Returns when the post-login dashboard route is
 * loaded — admins land on `/dashboard`, contractors on `/portal/dashboard`.
 */
export async function loginAs(page: Page, email: string, password: string, role: 'admin' | 'contractor' = 'admin') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  const expectedPath = role === 'contractor' ? '**/portal/dashboard' : '**/dashboard';
  // Generous timeout — Next.js dev recompiles the destination route on
  // first hit, which can take 30s+ on a cold cache.
  await page.waitForURL(expectedPath, { timeout: 60_000 });
}

export const LIVE_DEMO_ADMIN = {
  email: 'alice@demo.contractoros.test',
  password: 'pass1234',
} as const;

export const LIVE_DEMO_OTHER_ADMIN = {
  email: 'bob@demo.contractoros.test',
  password: 'pass1234',
} as const;

export const LIVE_DEMO_CONTRACTOR = {
  email: 'carol@demo.contractoros.test',
  password: 'pass1234',
} as const;

export const LOCAL_SEED_ADMIN = {
  email: 'admin@acme-corp.com',
  password: 'Password1',
} as const;

export const LOCAL_SEED_MANAGER = {
  email: 'manager@acme-corp.com',
  password: 'Password1',
} as const;

export const LOCAL_SEED_CONTRACTOR = {
  email: 'john.smith@example.com',
  password: 'Password1',
} as const;
