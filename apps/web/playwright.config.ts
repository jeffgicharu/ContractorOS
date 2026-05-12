import { defineConfig, devices } from '@playwright/test';

const LOCAL_BASE_URL = process.env.E2E_LOCAL_BASE_URL ?? 'http://localhost:3000';
const LIVE_BASE_URL = process.env.E2E_LIVE_BASE_URL ?? 'https://contractoros.jeffgicharu.com';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // ── LOCAL: comprehensive suite against pnpm dev / docker-compose ──
    {
      name: 'local-chromium',
      testDir: './e2e/local',
      use: { ...devices['Desktop Chrome'], baseURL: LOCAL_BASE_URL, actionTimeout: 30_000, navigationTimeout: 60_000 },
      retries: 0,
      timeout: 120_000,
      expect: { timeout: 15_000 },
      fullyParallel: true,
    },
    {
      name: 'local-firefox',
      testDir: './e2e/local',
      use: { ...devices['Desktop Firefox'], baseURL: LOCAL_BASE_URL, actionTimeout: 30_000, navigationTimeout: 60_000 },
      retries: 0,
      timeout: 120_000,
      expect: { timeout: 15_000 },
      fullyParallel: true,
    },
    {
      name: 'local-webkit',
      testDir: './e2e/local',
      use: { ...devices['Desktop Safari'], baseURL: LOCAL_BASE_URL, actionTimeout: 30_000, navigationTimeout: 60_000 },
      retries: 0,
      timeout: 120_000,
      expect: { timeout: 15_000 },
      fullyParallel: true,
    },

    // ── LIVE-SMOKE: gentle, retried, read-mostly probes against the deployed site ──
    {
      name: 'live-smoke-chromium',
      testDir: './e2e/live-smoke',
      use: { ...devices['Desktop Chrome'], baseURL: LIVE_BASE_URL },
      retries: 2,
      timeout: 30_000,
      expect: { timeout: 10_000 },
      fullyParallel: false,
    },
    {
      name: 'live-smoke-firefox',
      testDir: './e2e/live-smoke',
      use: { ...devices['Desktop Firefox'], baseURL: LIVE_BASE_URL },
      retries: 2,
      timeout: 30_000,
      expect: { timeout: 10_000 },
      fullyParallel: false,
    },
    {
      name: 'live-smoke-webkit',
      testDir: './e2e/live-smoke',
      use: { ...devices['Desktop Safari'], baseURL: LIVE_BASE_URL },
      retries: 2,
      timeout: 30_000,
      expect: { timeout: 10_000 },
      fullyParallel: false,
    },
  ],

  // Workers — overall cap. Per-project parallelism is controlled by `fullyParallel`
  // (live-smoke disables it to be gentle on the real server).
  workers: process.env.CI ? 4 : 4,
});
