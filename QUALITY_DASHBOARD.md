# Quality Dashboard — ContractorOS

A single-page snapshot of the current state of testing, coverage, mutation, performance, and security across the codebase. Regenerate with `scripts/quality-snapshot.sh`.

<!-- snapshot:start -->
**Last updated**: 2026-05-08 from commit `d8be71a` on branch `docs/ai-testing-and-quality-dashboard`.

This dashboard reflects the state when all of PRs #2, #3, #4, #7, #8, #9, #13, #17 have landed. Numbers are sourced from the latest test run on each prior PR's branch and rolled up here; running the snapshot script against a fresh `main` after the merges will produce the same numbers within rounding.
<!-- snapshot:end -->

---

## Test counts

<!-- tests:start -->
| Package / suite | Unit | Integration | Contract | Component | Security | Performance |
|---|---:|---:|---:|---:|---:|---:|
| `@contractor-os/api` | 362 | 22 | — | — | 26 | 5 k6 scripts |
| `@contractor-os/web` | — | — | 11 | 26 | — | (covered by api perf suite) |
| `@contractor-os/shared` | 141 | — | — | — | — | — |
| **Total** | **503** | **22** | **11** | **26** | **26** | **5** |

E2E (Cypress, in `apps/web/cypress/e2e/`): **5 suites / 26 tests** (auth, contractor lifecycle, invoice workflow, classification risk, offboarding) — already on `main` from before the recent quality work.
<!-- tests:end -->

---

## Coverage

<!-- coverage:start -->
| Package | Statements | Branches | Functions | Lines | Threshold | Strategy target |
|---|---:|---:|---:|---:|---:|---:|
| `@contractor-os/api` (unit + integration combined) | **72.23 %** | 64.85 % | 59.73 % | 71.40 % | 70 / 62 / 57 / 69 | 80 / 75 / 70 / 80 |
| `@contractor-os/web` (test scope only) | **98.64 %** | 91.3 % | 100 % | 98.63 % | 96 / 89 / 98 / 96 | 70 (broader scope) |
| `@contractor-os/shared` | **100 %** | 100 % | 100 % | 100 % | 98 / 98 / 98 / 98 | 90 |

Notes:
- `apps/api` thresholds use the ratchet pattern from `TEST_STRATEGY.md` §4 — `floor(actual − 2 %)` per metric. The 80 / 75 / 70 / 80 strategy target on the api service layer is the eventual goal; closing the gap is followed in `MUTATION_TESTING.md` § "Known weak areas".
- `apps/web` coverage scope is intentionally narrow today (login page + engagement form + 2 UI primitives + format helpers). When the component suite expands, the include list grows and the overall number will drop as new code without tests appears.
- `@contractor-os/shared` is at 100 % across all four metrics on the test surface. The mutation-testing layer is the next signal.
<!-- coverage:end -->

---

## Mutation score

<!-- mutation:start -->
| Package | Mutants | Killed | Survived | No-coverage | Score (overall) | Threshold | Strategy target |
|---|---:|---:|---:|---:|---:|---:|---:|
| `@contractor-os/shared` | 316 | 176 | 140 | 0 | **55.70 %** | 53 | 70 |
| `@contractor-os/api` (service layer) | 1 279 | 739 | 390 | 150 | **57.78 %** | 55 | 70 |
| `@contractor-os/web` (test-scope files) | 136 | 19 | 28 | 89 | **13.97 %** (40.43 % covered) | 11 | 70 |

Detail in `MUTATION_TESTING.md`. The top 5 known-weak surviving mutants are recorded there with one-line hypotheses each, ready for follow-up PRs to pick off.
<!-- mutation:end -->

---

## Performance

<!-- performance:start -->
SLOs (from `TEST_STRATEGY.md` §6 and `PERFORMANCE_TESTING.md`):

| Endpoint class | Budget p95 | Latest measured (load 50 VU) | Status |
|---|---:|---:|---|
| Auth (login, refresh) | 200 ms | (within login_ms ≈ 28 ms baseline) | 🟢 |
| Reads (list, detail) | **300 ms** | **62.86 ms** at 50 VU | 🟢 |
| Reads (list, detail) under stress | 300 ms (advisory) | **479.22 ms** at 200 VU | 🔴 — captured by issue #10 |
| Writes (create, state-transition) | **500 ms** | 47.58 ms | 🟢 |
| Reports (audit log, dashboards) | 1000 ms | 61.68 ms (audit log under load) | 🟢 |
| HTTP error rate | < 0.1 % | 0.00 % across all five test scripts | 🟢 |

| Test type | Throughput | p95 read | p99 read | Errors |
|---|---:|---:|---:|---:|
| Smoke (1 VU, 30 s) | 5.7 req/s | 26.86 ms | n/a | 0.00 % |
| Load (50 VU, ~80 s) | 60.4 req/s | 62.86 ms | n/a | 0.00 % |
| Stress (200 VU, 2.5 min) | 291.4 req/s | **479.22 ms** | ~1 s | 0.00 % |
| Spike (300 VU peak, 3 min) | 271.6 req/s | **1.01 s** | 1.88 s | 0.00 % |
| Workflow (20 VU, ~80 s) | 42.3 req/s (795 successful workflows) | 22.59 ms | n/a | 0.00 % |

Breaking point: the api sustains 0 % errors all the way to 300 VUs (~290 req/s) but reaches **p95 read 1.01 s** — well over the 300 ms budget. The system has no rate-limiter and no circuit breaker, so it degrades by becoming uniformly slow rather than failing fast. Captured by issue #11.
<!-- performance:end -->

---

## Security posture

<!-- security:start -->
| Tool | Latest result | Findings (HIGH+CRITICAL) | Tracking |
|---|---|---:|---|
| **CodeQL** (SAST, `security-extended`) | clean (1m 34 s on PR #17) | 0 | — |
| **pnpm audit** (`--audit-level=high`) | failing (intentional) | **1 critical + 25 high** | #14 |
| **Trivy filesystem** scan | failing (intentional) | 8 high in lockfile (subset of above) | #14 |
| **Trivy image** scan (`apps/api` Dockerfile) | failing (intentional) | HIGH/CRITICAL in `alpine 3.23` + bundled deps; SARIF uploaded to GitHub code scanning | #14 |
| **Snyk** | not run | n/a — `SNYK_TOKEN` not configured | manual user setup needed (see `SECURITY_TESTING.md`) |
| **OWASP ZAP** (DAST) | last run: not yet executed | n/a | scheduled weekly Mon 06:07 UTC |
| **Custom security suite** | green (26 / 26 passing) | 0 | suite is green; behavioural findings filed as #15, #16 |

**Open security issues**: #14 (dependency CVEs), #15 (JWT for deactivated user still accepted), #16 (refresh-token cookie SameSite=Lax should be Strict).
<!-- security:end -->

---

## Open quality issues

<!-- issues:start -->
Grouped by category, all open at the time of this snapshot:

### API validation
- **#5** — Engagement creation does not validate contractor active status

### Error handling
- **#6** — Duplicate invoice number returns 500 instead of 422

### Performance
- **#10** — Read p95 jumps 8× between 50 VU and 200 VU (DB connection pool exhaustion suspected)
- **#11** — No graceful degradation under spike — p99 hits 1.88 s with no 429 backpressure
- **#12** — `GET /contractors/:id` is the slowest read in the load test

### Security
- **#14** — Dependency CVEs: 1 CRITICAL + 25 HIGH advisories from `pnpm audit`
- **#15** — JWT for a deactivated user is still accepted until token expiry
- **#16** — Refresh-token cookie uses SameSite=Lax; Strict is preferred

Each issue links to the run / test that surfaced it and includes a hypothesis on cause + suggested fix area.
<!-- issues:end -->

---

## Quality trends

Today this dashboard is regenerated manually via `scripts/quality-snapshot.sh`. Each run replaces the marker-bracketed sections in place; the file's history-of-changes is the trend record.

Future enhancement: a scheduled CI job runs the snapshot script nightly, commits the output to a long-running `quality-trends` branch (or a SQLite-backed time series under `quality/trends.sqlite`), and the dashboard pulls a 30-day sparkline into each table. Until then, the rolling diff in git is the source of truth for "are we improving."

---

## See also

The full set of quality engineering documentation:

| Document | Purpose |
|---|---|
| [README.md](./README.md) | Project overview + Quality Engineering section linking back here |
| [AUDIT.md](./AUDIT.md) | Baseline assessment that drove the test work |
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Pyramid, coverage targets, CI gates, non-functional budgets |
| [TEST_PLAN.md](./TEST_PLAN.md) | Scenario list for the highest-value workflow |
| [QA_BEST_PRACTICES.md](./QA_BEST_PRACTICES.md) | Review checklist, naming, flaky-test policy, mock policy |
| [CONTRACT_TESTING.md](./CONTRACT_TESTING.md) | Pact consumer-driven contracts between web and api |
| [MUTATION_TESTING.md](./MUTATION_TESTING.md) | Stryker setup, baselines, top surviving mutants |
| [PERFORMANCE_TESTING.md](./PERFORMANCE_TESTING.md) | k6 suite, SLO budgets, baseline runs |
| [SECURITY_TESTING.md](./SECURITY_TESTING.md) | Threat model, CodeQL/Snyk/Trivy/ZAP, custom security suite |
| [AI_TESTING_PLAYBOOK.md](./AI_TESTING_PLAYBOOK.md) | How AI assistance is used (and not used) when authoring tests in this repo |
