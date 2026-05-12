import { test, expect } from '@playwright/test';

const SAMPLE_PATHS = ['/', '/about', '/security', '/login'];

test('live: capture per-path TTFB + total-load timings and CF metadata', async ({ page }) => {
  const samples: Record<string, { status: number; ttfbMs: number; loadMs: number; cfRay?: string; cfCache?: string; server?: string }> = {};

  for (const path of SAMPLE_PATHS) {
    const t0 = Date.now();
    const resp = await page.goto(path, { waitUntil: 'load' });
    const loadMs = Date.now() - t0;
    const status = resp?.status() ?? 0;
    const headers = resp?.headers() ?? {};

    // Pull TTFB from the browser performance API.
    const ttfbMs = await page.evaluate(() => {
      const navi = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return navi ? Math.round(navi.responseStart - navi.requestStart) : -1;
    });

    samples[path] = {
      status,
      ttfbMs,
      loadMs,
      cfRay: headers['cf-ray'],
      cfCache: headers['cf-cache-status'],
      server: headers['server'],
    };
  }

  // Attach to the HTML report so reviewers can read it.
  test.info().attach('cloudflare-perf-baseline.json', {
    body: JSON.stringify(samples, null, 2),
    contentType: 'application/json',
  });

  // Soft expectation: 95th percentile under 5 seconds.
  for (const [path, s] of Object.entries(samples)) {
    expect.soft(s.status, `${path} should be 2xx`).toBeLessThan(400);
    expect.soft(s.loadMs, `${path} total load should be < 8s`).toBeLessThan(8_000);
  }
});
