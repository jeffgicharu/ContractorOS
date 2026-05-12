import { test, expect } from '@playwright/test';

const SEED_PAGES = ['/', '/about', '/security', '/privacy', '/terms', '/contact', '/blog', '/careers'];

test('crawl public marketing pages — no internal link returns 4xx/5xx', async ({ page, request }) => {
  const baseUrl = page.context()._options.baseURL ?? '';
  const visited = new Set<string>();
  const failures: { from: string; to: string; status: number }[] = [];

  for (const seed of SEED_PAGES) {
    const resp = await page.goto(seed);
    if (!resp) continue;

    const links = await page.locator('a[href]').evaluateAll<string[]>((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? ''),
    );

    for (const href of links) {
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      let absolute: string;
      try {
        absolute = new URL(href, baseUrl || page.url()).toString();
      } catch { continue; }

      // Only crawl same-origin links.
      try {
        const u = new URL(absolute);
        const base = new URL(baseUrl || page.url());
        if (u.host !== base.host) continue;
      } catch { continue; }

      if (visited.has(absolute)) continue;
      visited.add(absolute);

      const r = await request.get(absolute, { failOnStatusCode: false }).catch(() => null);
      if (!r) continue;
      if (r.status() >= 400) failures.push({ from: seed, to: absolute, status: r.status() });
    }
  }

  expect(failures, `broken links: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
});
