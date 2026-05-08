# Mutation Testing — ContractorOS

Coverage tells you which lines were executed by tests. **It does not tell you whether those tests would actually fail if the code was wrong.** Mutation testing closes that gap by deliberately introducing small faults ("mutants") into the source code and re-running the test suite; if no test fails, the mutation "survived" and the test suite has a hole.

This repo runs [Stryker](https://stryker-mutator.io/) on all three packages.

---

## What mutation testing catches that coverage misses

A coverage report can hit 100% with a suite full of tests like `expect(x).toBeDefined()` — every line ran, every branch was exercised, but no test would actually fail if the function returned the wrong value. Mutation testing turns the question around: it makes a one-character change to the source (e.g. swap `>` for `>=`, swap `+` for `-`, replace a string literal with `""`, remove a function body) and asks "does any test fail now?". A high mutation score means the assertions actually constrain behaviour; a low mutation score with high coverage means the suite mostly executes code without checking the result.

For ContractorOS the highest-leverage targets are:

- The api **service layer** — business logic, state-machine transitions, RBAC checks. A surviving mutant here usually means a money-relevant behaviour is undertested.
- The shared **state machines** and **Zod schemas** — pure logic; surviving mutants reveal validation rules that don't actually reject the bad input.
- The web **forms with Zod validation** — surviving mutants reveal UI paths that accept data the schema would reject.

---

## Setup per package

| Package | Runner | Mutate scope | Concurrency |
|---|---|---|---|
| `apps/api` | Jest (`@stryker-mutator/jest-runner`) | `src/modules/**/*.service.ts` | 2 |
| `apps/web` | Vitest (`@stryker-mutator/vitest-runner`) | login page, engagement form, button, input, format helpers | 2 |
| `packages/shared` | Vitest (`@stryker-mutator/vitest-runner`) | `src/**/*.ts` excluding tests, `index.ts`, and `types/**` | 2 |

Each package has a `stryker.config.mjs` co-located with the package and a `test:mutation` script. The api config also sets `inPlace: true` because the workspace `moduleNameMapper` for `@contractor-os/shared` does not survive Stryker's default sandbox copy (the sandbox lives under `apps/api`, so `<rootDir>/../../../packages/shared/src` resolves outside it). Files are restored on graceful exit; on a hard crash, run `git restore apps/api/src` to undo any leftover mutations.

---

## Current baseline (this PR)

Measured 2026-05-07 on a 4-core machine with `concurrency: 2`.

| Package | Mutants | Killed | Survived | No-coverage | Score (overall) | Score (covered) | Wall-clock |
|---|---:|---:|---:|---:|---:|---:|---:|
| `packages/shared` | 316 | 176 | 140 | 0 | **55.70 %** | 55.70 % | 1m 12s |
| `apps/api` | 1279 | 739 | 390 | 150 | **57.78 %** | 65.46 % | 3m 43s |
| `apps/web` | 136 | 19 | 28 | 89 | **13.97 %** | 40.43 % | 1m 48s |
| **Total** | **1731** | **934** | **558** | **239** | — | — | **~6m 43s** |

The covered-score column matters because Stryker reports `no-coverage` mutants as "survived" by default in the overall calculation. For api and web the gap between overall and covered scores tells the story: closing the no-coverage portion (by importing more files into the test suite) is the cheapest way to drive the overall number up.

`apps/web` shows 89 no-coverage mutants because the vitest-runner under Stryker does not seem to reach the login page (`page.tsx` under the `(auth)/login/` Next.js group) or the engagement form during mutation runs, even though the same files are exercised by their `*.test.tsx` files in the regular suite. The simpler `button.tsx`, `input.tsx`, and `format.ts` files (no Next.js framework dependencies, no path-aliased shared imports) are mutated correctly. Investigation is tracked under "Known weak areas" below; the threshold is set against the overall score so any progress on that gap moves the number up.

---

## CI strategy

**Per-PR job** (chosen). Total wall-clock for the three suites is ~6m 43s, which fits inside the < 8 minute bracket of the strategy ladder in the brief. The `Mutation Tests (Stryker)` job in `.github/workflows/ci.yml` runs `pnpm test:mutation:all` on every PR and uploads the html + json reports under `mutation-reports` as a 30-day-retention artifact.

If wall-clock grows past 8 minutes (likely as the api scope expands beyond `*.service.ts`), the strategy moves to:

- **8–20 min**: per-changed-package on PR (via the `pnpm test:mutation:changed` script that diffs against `origin/main`) + nightly cron.
- **> 20 min**: nightly only, with a PR comment posting the previous nightly's score so reviewers can still see it.

The strategy ladder lives in this document so the choice can be re-evaluated when the scope changes.

---

## How to read the html report

Open `apps/api/reports/mutation/api/index.html` (or the equivalent for web / shared) in a browser — Stryker generates a single-page interactive UI. The top-level grid lists every file with its mutation score and a colour swatch (green for high, red for low). Click into a file to see the source with each mutation site highlighted; click a site to see the mutator name (e.g. `EqualityOperator`, `ConditionalExpression`), the replacement value, the killed/survived status, and which tests ran against it.

For CI artifacts, download the `mutation-reports` zip from the workflow run page and open the html files locally — the same UI works offline.

---

## How to investigate a surviving mutant

1. **Find the mutant**: open the html report, sort by status = Survived, click into the file.
2. **Read the original line and the replacement**. Decide whether the mutation is *equivalent* (the replacement code behaves identically — common with logger calls and dead-code paths) or *meaningful* (the replacement is observably different but no test caught it).
3. **For equivalent mutants**, mark the line with a `// Stryker disable next-line MutatorName: <reason>` comment so it is excluded from future runs.
4. **For meaningful mutants**, write a test that fails against the mutated code and passes against the original. That test usually asserts on the specific value or branch the mutator changed.
5. **Re-run** `pnpm --filter <pkg> test:mutation:incremental` (uses Stryker's incremental cache) to confirm the mutant is now killed without re-running the whole suite.
6. **Lift the threshold**. If the score has risen above the next 5-percent step, edit `stryker.config.mjs` and bump `low`/`break`/`high` so the gain is locked in.

---

## Targets

Per `TEST_STRATEGY.md` §4: **≥ 70 % mutation score on the api service layer** and on `packages/shared`, with no equivalent target for the web layer beyond "no regression below today's number". The current ratchet thresholds are the floor of the actual measurement minus 2 percentage points; they are interim values, not the eventual goal.

---

## Known weak areas

The five highest-signal surviving mutants from today's run, with a one-line hypothesis for each. **These are not fixed in this PR** — the brief explicitly scopes that out — they are recorded here so future PRs that touch the same files have a starting point.

| # | File | Line | Mutator | Hypothesis why it survived |
|---:|---|---:|---|---|
| 1 | `apps/api/src/modules/auth/auth.service.ts` | 101 | `EqualityOperator` (`<` → `<=`) | Refresh-token expiry check is exercised only by spec that uses tokens minutes from expiry, never on the boundary. A test for "token expiring this exact second" would kill it. |
| 2 | `apps/api/src/modules/auth/auth.service.ts` | 119 | `LogicalOperator` (`\|\|` → `&&`) | The `!user \|\| !user.is_active` short-circuit is covered by tests that hit one branch but never both, so flipping the operator doesn't change which tests run. |
| 3 | `apps/api/src/modules/classification/classification.service.ts` | 75 | `ConditionalExpression` (always-true) | The "risk level changed since last assessment" branch fires the notification side-effect; no current spec asserts on the notification, so removing the conditional is invisible to the suite. |
| 4 | `apps/api/src/modules/classification/classification.service.ts` | 190 | `EqualityOperator` (`>` → `>=`) | Boundary check on `engagementCount` for a contractor about to be flagged; the spec uses 0 and 2 but never 1, so the boundary mutation slips through. |
| 5 | `packages/shared/src/schemas/organization.schema.ts` | (multiple) | `StringLiteral` / `BlockStatement` | This schema (organization-settings update) is the lowest-scored at 12.50 %. The shared schema test for it asserts on `safeParse(...).success` only — no assertion on the parsed `data`, so any change that still parses is invisible. |

---

## Adding mutation testing to a new file

1. Add the file to the `mutate` glob in the package's `stryker.config.mjs`.
2. Run `pnpm --filter <pkg> test:mutation` and inspect the new mutants in the html report.
3. Follow the "How to investigate a surviving mutant" loop above.
4. Once the file's mutation score is at or above the package threshold, leave the threshold alone — the score is included in the global average. If you want to enforce a higher local bar, add a per-file threshold via `thresholds` in `stryker.config.mjs` (Stryker supports it).

---

## See also

The single index for all quality engineering work in this repo is **[QUALITY_DASHBOARD.md](./QUALITY_DASHBOARD.md)** — coverage, mutation, performance, and security metrics in one place.

| Document | Purpose |
|---|---|
| [AUDIT.md](./AUDIT.md) | Baseline assessment that drove the test work |
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Pyramid, coverage targets, CI gates, non-functional budgets |
| [TEST_PLAN.md](./TEST_PLAN.md) | Scenario list for the highest-value workflow |
| [QA_BEST_PRACTICES.md](./QA_BEST_PRACTICES.md) | Review checklist, naming, flaky-test policy, mock policy |
| [CONTRACT_TESTING.md](./CONTRACT_TESTING.md) | Pact consumer-driven contracts between web and api |
| [MUTATION_TESTING.md](./MUTATION_TESTING.md) | Stryker setup, baselines, top surviving mutants |
| [PERFORMANCE_TESTING.md](./PERFORMANCE_TESTING.md) | k6 suite, SLO budgets, baseline runs |
| [SECURITY_TESTING.md](./SECURITY_TESTING.md) | Threat model, CodeQL/Snyk/Trivy/ZAP, custom security suite |
| [AI_TESTING_PLAYBOOK.md](./AI_TESTING_PLAYBOOK.md) | How AI assistance is used (and not used) when authoring tests |
