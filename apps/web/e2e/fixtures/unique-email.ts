/**
 * Generates a throwaway e-mail / slug for live-smoke tests that need to
 * create data. The daily cleanup cron on the VPS deletes everything
 * matching this prefix at 03:00 UTC, so polluting the live DB is bounded
 * to at most ~24 hours.
 */
export function uniqueEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-test-${ts}-${rand}@demo.contractoros.test`;
}

export function uniqueSlug(prefix = 'org'): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-test-${prefix}-${ts}-${rand}`;
}
