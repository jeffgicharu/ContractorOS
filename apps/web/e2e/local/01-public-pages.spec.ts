import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = ['/', '/about', '/security', '/privacy', '/terms', '/contact'];

for (const path of PUBLIC_PAGES) {
  test(`public page ${path} renders without console errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => failedRequests.push(`${req.method()} ${req.url()}`));

    const resp = await page.goto(path);
    expect(resp?.status(), `${path} should return 2xx`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();

    // Ignore dev-server hot-reload / favicon noise and the SPA's auth-state
    // probe (logged-out → 401 on /me). Anything else must be empty.
    const fatal = consoleErrors.filter((e) => !/favicon|sourcemap|401/i.test(e));
    expect(fatal, `console errors on ${path}`).toEqual([]);
    expect(failedRequests, `failed requests on ${path}`).toEqual([]);
  });
}
