# Performance Testing — ContractorOS

This repo runs [k6](https://k6.io/) performance tests against the api with enforced SLO budgets. The suite is organised by intent — smoke, load, stress, spike, workflow — so a reviewer can pick the right shape of test for the question they are asking.

---

## What and why

Functional tests (api integration, contract, E2E) prove the api **behaves** correctly. Performance tests prove the api **scales** correctly: that p95 read latency stays under 300 ms at nominal load, that the system degrades gracefully under spikes, and that the breaking point is far enough away that we have warning before it hits production.

Without enforced perf budgets in CI, performance regressions land silently — a join that adds 50 ms looks innocent at one VU but compounds to 500 ms at 50 VU. The k6 thresholds in this suite fail the build when any of those budgets is missed.

---

## Test types and goals

| Test | File | Shape | Goal |
|---|---|---|---|
| **Smoke** | `performance/k6/smoke.js` | 1 VU for 30 s | Sanity check every endpoint at minimal load. Runs on every PR; fails the build on any SLO miss. |
| **Load** | `performance/k6/load.js` | 0 → 50 VU over 1 min, hold 5 min, ramp down 1 min | Sustained nominal traffic. Captures req/s, error rate, and per-endpoint p50/p95/p99 under realistic mix (70/25/5 read/mixed/write). |
| **Stress** | `performance/k6/stress.js` | 0 → 200 VU over 5 min, hold 5 min, ramp down 2 min | Find the breaking point. SLO thresholds are advisory; the test runs to completion so we measure where p99 explodes and where the error rate climbs above 1 %. |
| **Spike** | `performance/k6/spike.js` | 10 VU baseline → 300 VU for 1 min → 10 VU | Measure how the system handles a 30× traffic surge. Records both peak latency and recovery time. |
| **Workflow** | `performance/k6/workflow.js` | 0 → 20 VU over 30 s, hold 5 min, ramp down 30 s | Per-VU end-to-end onboarding-to-paid-invoice journey (list contractors → list submitted invoices → open one → approve → check audit log). Each iteration counts as one workflow; the success counter is asserted. |

All five scripts import `performance/k6/lib/thresholds.js` for the canonical SLO budgets, share auth via `lib/auth.js`, and use `lib/data.js` to pull a randomised set of real seeded ids so VUs hit different rows instead of hammering the same one.

Every script accepts `SHORT=1` to run a compressed-duration variant — useful for local iteration; CI runs full duration.

---

## Performance budgets

Restated from `TEST_STRATEGY.md` §6.

| Endpoint class | p95 budget | p99 budget |
|---|---:|---:|
| Auth (login, refresh) | 200 ms | 400 ms |
| Reads (list, detail) | **300 ms** | 600 ms |
| Writes (create, state-transition) | **500 ms** | 1000 ms |
| Reports (dashboards, 1099 readiness, audit) | 1000 ms | 2000 ms |

| HTTP error rate | < 0.1 % under nominal load |
| Spike recovery (return to baseline p95) | < 60 s after the spike ends |

---

## How to run locally

### One-time setup

```bash
# 1. Build the workspace so apps/api/dist/main.js exists
pnpm install
pnpm --filter @contractor-os/shared build
pnpm --filter @contractor-os/api build
```

### Bring up the perf-target environment

```bash
docker compose -f docker-compose.perf.yml up -d
DATABASE_URL=postgresql://contractor_os:contractor_os@localhost:5434/contractor_os_perf \
  pnpm --filter @contractor-os/api exec tsx performance/seed-perf-data.ts
```

The api ends up on `http://localhost:3001`. The seed script populates ~1 k orgs / 1 k admin users / 10 k contractors / 5 k engagements / 50 k invoices in ≈ 7 s.

### Run a test

```bash
# Smoke (30 s; the CI-PR gate)
k6 run performance/k6/smoke.js

# Load (full 7 min)
k6 run performance/k6/load.js
# Compressed (~1 min) for local iteration
SHORT=1 k6 run performance/k6/load.js

# Stress (full 12 min)
k6 run performance/k6/stress.js
SHORT=1 k6 run performance/k6/stress.js   # ~2.5 min compressed

# Spike (~3 min)
k6 run performance/k6/spike.js

# Workflow (full 6 min)
k6 run performance/k6/workflow.js
SHORT=1 k6 run performance/k6/workflow.js # ~1.5 min compressed
```

### Tear down

```bash
docker compose -f docker-compose.perf.yml down -v
```

---

## Baseline results (2026-05-07)

Captured against the seeded volumes on a 4-core local machine. CI baselines will appear here as the nightly Performance Full Suite runs accumulate.

| Test | Mode | VUs (peak) | Duration | Total req | req/s | Err rate | p95 read | p95 write | Result |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Smoke | full | 1 | 30 s | 171 | 5.7 | 0.00 % | 26.86 ms | n/a | ✓ all SLOs green |
| Load | SHORT | 50 | 1 m 20 s | 4 858 | 60.4 | 0.00 % | 62.86 ms | 47.58 ms | ✓ all SLOs green |
| Stress | SHORT | 200 | 2 m 30 s | 43 748 | 291.4 | 0.00 % | **479.22 ms** | n/a | ✗ read p95 over budget by 60 % |
| Spike | full | 300 | 2 m 30 s | 40 767 | 271.6 | 0.00 % | **1.01 s** | n/a | ✗ read p95 over budget by 3.4× |
| Workflow | SHORT | 20 | 1 m 17 s | 3 183 | 42.3 | 0.00 % | 22.59 ms | n/a (4xx-by-design) | ✓ 795 successful workflows |

### Breaking point

The stress test sustains 0 % errors all the way to 200 VUs (~290 req/s) but reaches **p95 read latency 479 ms** there — over the 300 ms read budget by 60 %. The system does not error out at this concurrency; it just becomes uniformly slow. The same is true at the 300 VU peak of the spike (p95 1.01 s, max 1.88 s, still 0 % errors).

In other words: the api **never hits a hard breaking point in this run** — it degrades gracefully until requests take seconds, then keeps serving. That is its own problem, captured in issue #11.

---

## Top 3 bottlenecks identified

| # | Bottleneck | Issue |
|---:|---|---|
| 1 | Read latency p95 jumps 8× between 50 and 200 VU. Hypothesis: pg.Pool max=20 is the bottleneck and the queue serialises throughput at high concurrency. | [#10](https://github.com/jeffgicharu/ContractorOS/issues/10) |
| 2 | No graceful degradation under spike — at 300 VU every request becomes slow (p99 1.88 s) but the api never returns 429 / 503. | [#11](https://github.com/jeffgicharu/ContractorOS/issues/11) |
| 3 | `GET /contractors/:id` is ≈ 2× slower than the other read endpoints under load. Hypothesis: the LATERAL JOIN chain in `ContractorsRepository.findDetailById` does meaningful work per request even at small data volumes. | [#12](https://github.com/jeffgicharu/ContractorOS/issues/12) |

These issues are **not fixed in PR #10** — they are recorded so future PRs that touch the same area can pick them up.

---

## CI strategy

| When | What | Where |
|---|---|---|
| **Every PR** | `Performance Smoke` job — runs `smoke.js` (~1 min) against a freshly built+seeded perf environment. Fails the build on any SLO miss. | `.github/workflows/ci.yml` |
| **Nightly 03:00 UTC** | `Performance Full Suite` job — runs `load.js`, `stress.js`, `spike.js`, `workflow.js` in sequence (~30 min) against a fresh environment. Uploads HTML+JSON reports as artifacts. Posts a summary comment to a tracking issue. | `.github/workflows/performance-nightly.yml` |

Two-tier strategy keeps PR feedback fast while still catching slow-burn regressions. The nightly tracking issue accumulates a time series — first slowdown that crosses a threshold becomes a PR comment.

---

## How to add a new test scenario

1. **Pick the test type** — a one-off spike at a new endpoint goes in `spike.js`; a sustained-load measurement of a new write path goes in `load.js`; a multi-step user journey goes in `workflow.js`. Don't add a new top-level script unless none of the existing ones fits.
2. **Reuse the helpers** — auth from `lib/auth.js`, ids from `lib/data.js`, custom metrics from `lib/metrics.js`, thresholds from `lib/thresholds.js`. Don't hard-code a token or an id.
3. **Tag the request** — add `tags: { endpoint: 'read' | 'write' | 'report', resource: '<resource-name>' }` to every `http.*()` call so the per-endpoint thresholds in `lib/thresholds.js` apply.
4. **Run locally with SHORT=1** to validate the script. Confirm all checks pass and no thresholds are advisory-failing on a clean run.
5. **Capture the baseline** — run the full duration once and copy the relevant numbers into the table in this document.
6. **Wire it into CI** if the new script is meant to run on a schedule. Smoke-class scripts go in the per-PR job; longer-running scripts go in the nightly workflow.

A new endpoint is considered "perf-tested" when (a) it appears in at least one of `smoke.js`, `load.js`, `stress.js`, or `workflow.js`, (b) it has an explicit threshold in `lib/thresholds.js` (via the `endpoint` tag), and (c) the baseline number is recorded above.
