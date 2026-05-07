# Test Strategy — ContractorOS

## 1. Purpose & Scope

This document is the canonical reference for **how** ContractorOS is tested. It is written for:

- **Engineers** authoring features and bug fixes — to know which test layer to add code at.
- **Reviewers** assessing PRs — to evaluate whether a change is adequately covered.
- **New hires** ramping up — to understand the testing culture and tooling without reading every test file.

The strategy applies to all three workspaces: `apps/api` (NestJS), `apps/web` (Next.js), and `packages/shared` (TypeScript types, Zod schemas, state machines). It does **not** prescribe specific tests — those belong in `TEST_PLAN.md` and in test files themselves.

The strategy is intentionally aspirational. Where the current state diverges from the targets here, the gap is documented in `AUDIT.md` and addressed incrementally.

---

## 2. Testing Philosophy

Six principles, in priority order. When two principles conflict, the earlier one wins.

1. **Test behaviour, not implementation.** Tests assert on observable outcomes — HTTP responses, DB state changes, rendered DOM, emitted events. They do not assert on private method calls, internal variable names, or rendered class names. A refactor that preserves behaviour must not require test changes.

2. **Prefer integration over heavy-mock unit tests.** A unit test that mocks the database, the clock, and three collaborators is testing the mocks more than the code. For the api layer we run repository and controller tests against a real Postgres (Testcontainers) and assert on real SQL state. We mock only at process boundaries we do not own (third-party paid services, outbound webhooks, the wall clock when a test depends on time).

3. **Tests are documentation.** A reader skimming `*.spec.ts` should understand the feature's contract without opening the source file. Test names use full sentences (`describe('InvoicesService.submit', () => it('rejects an invoice with no line items', ...))`) and arrange/act/assert blocks are clearly separated.

4. **Fast feedback wins.** Unit and component tests must run in under 30 s per package on a developer laptop. Integration tests target under 3 minutes. The full PR pipeline targets under 12 minutes. We measure these and treat slowdowns as defects.

5. **Determinism over speed if forced to choose.** Flakiness erodes trust faster than a slow suite. A test that passes 99 times out of 100 is a broken test, not an acceptable one. See `QA_BEST_PRACTICES.md` for the flaky-test policy.

6. **Production parity in the test environment.** Tests run against the same Postgres major version as production, the same Node major version, and the same TypeScript strict-mode settings. We do not test against SQLite, in-memory shims, or downgraded compiler options.

---

## 3. Test Pyramid for ContractorOS

The pyramid is wide at the bottom (cheap, fast, many) and narrow at the top (expensive, slow, few). Each level lists the tooling we standardise on.

```
                  ┌──────────────────────┐
                  │   E2E (Cypress)      │     few — full user journeys
                  ├──────────────────────┤
                  │  Contract (Pact)     │     a handful — each consumer-provider pair
                  ├──────────────────────┤
                  │ Component (RTL+Jest) │     many — every stateful component
                  ├──────────────────────┤
                  │   Integration        │     many — every controller, every repository
                  │   (Jest + supertest  │
                  │    + Testcontainers) │
                  ├──────────────────────┤
                  │       Unit           │     most — every service, schema, state machine
                  │  (Jest api / Vitest  │
                  │   web & shared)      │
                  └──────────────────────┘
```

### 3.1 Unit

| Workspace | Runner | Scope |
|---|---|---|
| `apps/api` | **Jest** + `ts-jest` | Service classes (business logic), pure helpers, scoring engines (IRS / DOL / ABC), state-machine validators. Repositories are excluded — they belong in integration. |
| `apps/web` | **Vitest** | Pure React hooks, formatting helpers, the typed `api-client` wrapper, Zod-derived form helpers. UI rendering belongs in Component. |
| `packages/shared` | **Vitest** | Every Zod schema (round-trip plus failure cases), state-machine transition validator, constants/enums consistency, type-narrowing helpers. |

Unit tests run on every commit via `pnpm --filter <pkg> test` and on every PR in CI.

### 3.2 Integration

| Concern | Tooling | Scope |
|---|---|---|
| Repository → DB | **Jest + Testcontainers (`@testcontainers/postgresql`)** | Each of the 12 repositories under `apps/api/src/modules/*/`. Spin up a real Postgres container per suite, run the same migrations as production, exercise the real SQL, assert on real rows. Each test wrapped in a transaction and rolled back. |
| Controller → service → repository | **Jest + supertest + Testcontainers** | Every controller endpoint (~59 routes under `/api/v1`). Asserts on response envelope, status code, headers, audit-log writes, guard chain (`JwtAuthGuard → RolesGuard → OrganizationGuard`), Zod validation pipe. |
| Cross-module workflows | **Jest + supertest + Testcontainers** | Multi-step server flows that must hold within a single transaction or audit boundary (e.g. submit invoice → audit-log row written → notification row written). |

Integration tests target under 3 minutes total. Containers are reused across suites in the same Jest run via Testcontainers' singleton helper to keep startup cost amortised.

### 3.3 Contract

| Pair | Tooling | Scope |
|---|---|---|
| `apps/web` (consumer) ↔ `apps/api` (provider) | **Pact** (`@pact-foundation/pact` consumer, provider verification job) | Every endpoint the web client calls. Pact files generated in the consumer test run, published to a Pact Broker, verified against the api on its own pipeline. |

Contract tests give a runtime guarantee that the type-level parity provided by `packages/shared` Zod schemas survives independent deploys.

### 3.4 Component

| Workspace | Tooling | Scope |
|---|---|---|
| `apps/web` | **React Testing Library** + **Vitest** + **Storybook** | Every stateful component under `src/components/`: invoices, contractors, offboarding, classification, time-entries, documents, notifications, layout. Asserts on rendered DOM, accessible roles, user interactions via `userEvent`. Storybook continues to host the visual catalogue. |

Component tests do not hit the real api — the `api-client` is mocked at the fetch boundary using **MSW (Mock Service Worker)** so routing, request bodies, and response handling are exercised end-to-end on the frontend side.

### 3.5 End-to-End

| Tooling | Scope |
|---|---|
| **Cypress** (already in tree at `apps/web/cypress/`) | Five existing suites cover auth, contractor lifecycle, invoice workflow, classification risk, offboarding. Future expansion adds documents, time-entries, audit-log filtering, notifications, multi-tenant isolation, and contractor-portal flows. Runs against a seeded Postgres + the real api + the real web app. |

E2E is intentionally narrow — it asserts on top-level user journeys, not edge cases. Edge cases live one or two layers down where they are cheaper.

### 3.6 Accessibility

| Tooling | Scope |
|---|---|
| **axe-core** via `@axe-core/react` (component layer) and `cypress-axe` (E2E layer) | Every page that renders user input or tabular data. WCAG 2.1 AA conformance. Asserts in CI; failures block the PR. |

### 3.7 Performance

| Tooling | Scope |
|---|---|
| **k6** | Scenario scripts for the highest-traffic endpoints: login, invoice list (paginated), invoice submit, classification re-score. Runs on a nightly schedule against a dedicated environment with a fixed seed. Posts results to a baseline file checked into the repo. |

Performance is treated as a non-functional test discipline, not a one-off exercise. Budgets are encoded in the k6 thresholds (see §6).

### 3.8 Security

| Tooling | Tests What |
|---|---|
| **OWASP ZAP** (baseline scan via `ghcr.io/zaproxy/zaproxy:stable`) | Active + passive scan of the running web + api. Catches XSS, SQLi-style payload reflection, missing security headers, insecure cookie flags. |
| **Trivy** | Filesystem scan of the repo (lockfile vulnerabilities, exposed secrets in git history) and container-image scan if/when we ship images. |
| **Snyk Open Source** | npm dependency vulnerabilities with auto-remediation PRs. Authenticated, requires `SNYK_TOKEN`. |
| **GitHub CodeQL** | SAST on TypeScript across all three workspaces. Runs on every PR and on a weekly cron. |
| **GitHub Dependency Review** | Blocks PRs that introduce dependencies with known high/critical CVEs. |

### 3.9 Mutation

| Tooling | Scope |
|---|---|
| **Stryker** (`@stryker-mutator/core` + `@stryker-mutator/jest-runner`) | Targets the high-leverage logic: `apps/api/src/modules/classification/scoring/*` (IRS, DOL, ABC, aggregator), `packages/shared/src/constants/state-machines.ts`, all state-transition validators. Lower-value files are excluded so the run completes in under 30 minutes. |

Mutation is the test for the tests. A high coverage number with a low mutation score means the suite executes lines but does not actually assert on them.

---

## 4. Coverage Targets

Targets are aspirational and measured per package via Jest / Vitest `--coverage`. They are wired into the runner's `coverageThreshold` config so a regression fails CI.

| Package | Statements | Branches | Lines | Functions |
|---|---:|---:|---:|---:|
| `apps/api` | **80 %** | **75 %** | **80 %** | **70 %** |
| `apps/web` | **70 %** | 65 % | 70 % | 60 % |
| `packages/shared` | **90 %** | 85 % | 90 % | 85 % |

`apps/web` targets are deliberately lower because pure-presentation components (icons, marketing pages) drag the denominator without adding signal. The 70 % target focuses on **stateful components, forms, and hooks** — visual pieces are exempt from the coverage collector.

`packages/shared` targets are the highest because the package is pure logic — no I/O, no UI — and a single bug there ripples through both apps.

### Mutation score target

- **`apps/api` service layer (`*.service.ts`) and scoring engines: ≥ 70 %.**

We measure mutation only where it pays back the runtime cost. Repositories are excluded (their tests are integration, where mutation is awkward); UI is excluded (low-value mutants); shared schemas are excluded because Zod's library-level guarantees already cover most mutants.

### What does not count toward coverage

- Generated code (`*.generated.ts`).
- Storybook stories (`*.stories.*`).
- Type-only files (`*.d.ts`, `types/*.ts`).
- Migrations (one-shot scripts, validated by the `db-migrate-check` CI job).
- Seeds (validated by `pnpm --filter @contractor-os/api seed` running in CI).

---

## 5. CI Quality Gates

Every PR to `main` must pass the following before it can merge. Gates fail fast — the cheapest checks run first.

| # | Gate | Runs | Blocks Merge On |
|---:|---|---|---|
| 1 | `pnpm install --frozen-lockfile` | every job | lockfile drift |
| 2 | `pnpm type-check` | one job, parallel | any TS error |
| 3 | `pnpm lint` | one job, parallel | any ESLint error |
| 4 | `pnpm --filter @contractor-os/shared test` | one job, parallel | any test fail / coverage threshold breach |
| 5 | `pnpm --filter @contractor-os/api test` (unit) | one job, parallel | any test fail / coverage threshold breach |
| 6 | `pnpm --filter @contractor-os/web test` (unit + component) | one job, parallel | any test fail / coverage threshold breach |
| 7 | `pnpm --filter @contractor-os/api test:integration` (Testcontainers) | one job | any test fail |
| 8 | Pact consumer tests (web) + provider verification (api) | one job | any contract mismatch |
| 9 | Storybook build | one job, parallel | any story build failure |
| 10 | Cypress E2E (`postgres:16` service) | one job, depends on 1-7 | any test fail / new accessibility violation |
| 11 | DB migration check | one job, parallel | any migration error |
| 12 | GitHub CodeQL (TypeScript) | one job, parallel | any new high/critical alert |
| 13 | GitHub Dependency Review | one job, parallel | any new dependency with high/critical CVE |
| 14 | Trivy filesystem scan | one job, parallel | any new high/critical CVE |
| 15 | Snyk Open Source | one job, parallel (token-gated) | any new high/critical, beyond budget |
| 16 | OWASP ZAP baseline | nightly cron, advisory on PRs | any new high-confidence finding |
| 17 | k6 performance smoke | nightly cron, advisory on PRs | any threshold breach (see §6) |
| 18 | Stryker mutation | weekly cron | mutation score below target (warning, not blocker initially) |

Gates 1–14 are **blocking** on every PR. Gates 15–18 are scheduled or token-gated; they post results back to the PR but do not block.

The deploy pipeline (`deploy.yml`) reuses the same gates via `workflow_call`.

---

## 6. Non-Functional Targets

Concrete, measurable budgets. Enforced by k6 thresholds for latency and error rate, and by the security gates for the vulnerability budget.

### Latency

Measured at the api edge (NestJS handler, excluding network RTT to the client) under nominal load (50 RPS sustained, mixed read/write at 80/20).

| Endpoint Class | p50 | p95 | p99 |
|---|---:|---:|---:|
| Auth (login, refresh) | < 80 ms | < 200 ms | < 400 ms |
| Reads (list, detail) | < 120 ms | **< 300 ms** | < 600 ms |
| Writes (create, state-transition) | < 200 ms | **< 500 ms** | < 1000 ms |
| Reports (1099 readiness, classification dashboard) | < 400 ms | < 1000 ms | < 2000 ms |

### Error rate

- **HTTP 5xx rate < 0.1 %** under nominal load.
- **HTTP 4xx rate < 5 %** under nominal load (non-2xx is allowed for validation pushback; we monitor regressions in the 4xx band).

### Dependency vulnerabilities

Measured by Snyk + Trivy + GitHub Dependency Review across both apps and the shared package.

- **Zero critical** outstanding at any time. A critical CVE blocks the next merge until resolved or formally accepted with a documented exception.
- **Maximum 5 high** outstanding. The 6th high opens an issue and pauses non-fix merges.
- **No budget on medium/low** beyond Dependabot tracking. Medium/low are batched into monthly upgrade PRs.

### Accessibility

- **Zero new axe-core violations** of WCAG 2.1 AA on any PR. Existing violations are tracked in an issue and fixed incrementally.

---

## 7. Tooling Inventory

The canonical list. If a tool is not in this table, it is not part of the official strategy.

| Tool | Tests What | Where Runs | Owner |
|---|---|---|---|
| **Jest** + `ts-jest` | api unit tests (services, helpers, scoring) | pre-commit (changed files), CI on every PR | Backend team |
| **Vitest** | web + shared unit tests, web hooks, web `api-client` | pre-commit (changed files), CI on every PR | Frontend team / Shared owner |
| **React Testing Library** + Vitest | web component tests (DOM, interactions, accessibility roles) | pre-commit (changed files), CI on every PR | Frontend team |
| **MSW** | Mock fetch boundary in component tests | CI on every PR (component layer) | Frontend team |
| **supertest** | api controller HTTP integration | CI on every PR (integration job) | Backend team |
| **Testcontainers** (`@testcontainers/postgresql`) | api repository + controller integration against real Postgres | CI on every PR (integration job) | Backend team |
| **Pact** | Web consumer ↔ api provider contracts | CI on every PR (consumer + provider verification) | Backend & Frontend, joint |
| **Cypress** | End-to-end user journeys | CI on every PR (E2E job) | Frontend team |
| **`cypress-axe`** + `@axe-core/react` | Accessibility (component + E2E) | CI on every PR (component + E2E jobs) | Frontend team |
| **Storybook** | Visual component catalogue, smoke build | CI on every PR (storybook-build job) | Frontend team |
| **k6** | Performance / load testing of api endpoints | Nightly cron, advisory on PRs that touch hot paths | Backend team |
| **OWASP ZAP** | DAST against running api + web | Nightly cron, advisory on PRs | Security / Backend |
| **Trivy** | Filesystem + dependency CVE scan, secret scan | CI on every PR | Security / DevOps |
| **Snyk Open Source** | npm dependency CVE scan, auto-fix PRs | CI on every PR (token-gated) | Security |
| **GitHub CodeQL** | SAST on TypeScript | CI on every PR + weekly cron | Security |
| **GitHub Dependency Review** | Block PRs that introduce vulnerable deps | CI on every PR | Security |
| **Stryker** | Mutation testing on api services + scoring + state machines | Weekly cron | Backend team |
| **ESLint** (flat config) | Lint, code style, best practices | pre-commit, CI on every PR | All |
| **Prettier** | Formatting | pre-commit, CI on every PR | All |
| **TypeScript** strict mode | Type-check | pre-commit, CI on every PR | All |
| **node-pg-migrate** | DB migration smoke (apply on a clean DB, run seed) | CI on every PR (db-migrate-check job) | Backend team |

`pre-commit` is implemented via lint-staged so only the changed files run their relevant gates locally. `pre-push` is reserved for fast tests only (unit + lint + type-check); integration and E2E run in CI.
