# End-to-end test suites

Two Playwright projects live under this directory:

| Folder | Target | Purpose |
|---|---|---|
| `local/` | `http://localhost:3000` (pnpm dev) | Comprehensive — destructive flows allowed |
| `live-smoke/` | `https://contractoros.jeffgicharu.com` | Gentle — read-only against demo accounts |

Each project runs on **chromium + firefox + webkit**. Config lives in
[`../playwright.config.ts`](../playwright.config.ts).

## Commands

```bash
pnpm --filter @contractor-os/web test:e2e         # both projects
pnpm --filter @contractor-os/web test:e2e:local   # local only
pnpm --filter @contractor-os/web test:e2e:live    # live-smoke only
pnpm --filter @contractor-os/web test:e2e:ui      # interactive UI mode
```

## Demo accounts (live-smoke)

Seeded by [`apps/api/scripts/seed-demo-accounts.ts`](../../api/scripts/seed-demo-accounts.ts).
Idempotent — re-running upserts; never deletes. All accounts share the
password `pass1234`.

| Email | Role | Org | Used for |
|---|---|---|---|
| `alice@demo.contractoros.test` | admin | Demo Co | Primary admin login |
| `bob@demo.contractoros.test` | admin | Other Org | Multi-tenant cross-org probe |
| `carol@demo.contractoros.test` | contractor | Demo Co | Portal-side login |

Live-smoke tests **must** treat these accounts as read-only fixtures.
Any state they create must use the throwaway prefix below.

## Data pollution discipline

When a live-smoke test must create rows, the inserted email/slug uses the
prefix `e2e-test-<timestamp>-<random>` (helper:
[`fixtures/unique-email.ts`](./fixtures/unique-email.ts)). A daily cron on
the VPS (`/usr/local/bin/cleanup-e2e-test-data.sh`, 03:00 UTC) deletes
every row whose email or slug matches that prefix across
`users / contractors / organizations / refresh_tokens / notifications /
audit_events`.

Local-suite tests have no such restriction — they run against an
ephemeral DB and may insert/delete freely.

## Annotations & expected failures

Tests under `local/11-known-bug-characterization.spec.ts` and
`live-smoke/06-live-bug-characterization.spec.ts` use `test.fail()` to
record the *current* buggy behavior of each open backlog issue. When the
corresponding fix lands, these tests start unexpectedly passing and CI
turns red — that's the signal to update the assertion to the corrected
behavior in the same PR as the fix.
