# Quality Engineering Baseline — ContractorOS

Baseline assessment of test infrastructure, CI/CD posture, and quality coverage. Documents the current state and identifies gaps to inform ongoing quality engineering improvements.

Run on: 2026-05-07. Repo HEAD: `d8be71a` (`feat: add page titles for all 32 routes`).

---

## 1. Stack & Versions

### Runtime

| Layer | Tool | Version |
|---|---|---|
| Node.js | nvm-managed | 22.16.0 |
| Package manager | pnpm | 10.28.0 (lockfile pinned via `packageManager` field) |
| Build orchestrator | Turborepo | 2.8.9 |
| Database | PostgreSQL | 16 (CI), 18.1 (local dev — backwards compatible) |
| Process manager | PM2 | via `ecosystem.config.cjs` (production VPS only) |

### Languages & Frameworks

| Package | Framework | Version |
|---|---|---|
| `@contractor-os/api` | NestJS | 11.1.13 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) |
| `@contractor-os/api` | Auth | `@nestjs/jwt` 11.0.2, `@nestjs/passport` 11.0.5, `passport-jwt` 4.0.1, `bcrypt` 6.0.0 |
| `@contractor-os/api` | DB driver | `pg` 8.18.0 (raw SQL, no ORM) |
| `@contractor-os/api` | Migrations | `node-pg-migrate` 8.0.4 |
| `@contractor-os/api` | Scheduling | `@nestjs/schedule` 6.1.1 (daily classification CRON) |
| `@contractor-os/api` | Loader | `tsx` 4.21.0 (seed/migration scripts) |
| `@contractor-os/web` | Next.js | 15.2.0 (App Router) |
| `@contractor-os/web` | React | 19.0.0 |
| `@contractor-os/web` | Styling | Tailwind CSS 4.1.18 (with `@tailwindcss/postcss`) |
| `@contractor-os/web` | Charts | `recharts` 3.7.0 |
| `@contractor-os/web` | Animation | `motion` 12.34.3, `react-parallax-tilt` 1.7.319 |
| `@contractor-os/web` | Icons | `lucide-react` 0.575.0 |
| `@contractor-os/shared` | Validation | `zod` 3.24.0 |
| All packages | Language | TypeScript 5.9.3 (strict mode, no `any`) |

### Test & Quality Tooling

| Tool | Version | Where |
|---|---|---|
| Jest | 29.7.0 | `apps/api`, `apps/web` (configured but unused), `packages/shared` (script declared, binary not installed) |
| `ts-jest` | 29.4.6 | `apps/api`, `apps/web` |
| `jest-environment-jsdom` | 29.7.0 | `apps/web` |
| `@testing-library/react` | 16.3.2 | `apps/web` (no tests yet) |
| `@testing-library/jest-dom` | 6.9.1 | `apps/web` (no tests yet) |
| `supertest` | 7.2.2 | `apps/api` (declared, unused) |
| Cypress | 14.0.0 | `apps/web` |
| Storybook | 8.6.17 (`@storybook/nextjs`) | `apps/web` (webpack pinned to 5.101.2 for Next.js 15 compat) |
| ESLint | 9.28.0 (flat config, `eslint.config.mjs`) | repo root |
| Prettier | 3.8.1 | repo root |
| `typescript-eslint` | 8.55.0 | repo root |

---

## 2. Architecture

### Monorepo Layout

```
contractor-os/
├── apps/
│   ├── api/              @contractor-os/api  — NestJS REST backend
│   └── web/              @contractor-os/web  — Next.js App Router frontend
├── packages/
│   └── shared/           @contractor-os/shared — TS types, Zod schemas, constants/state machines
├── pnpm-workspace.yaml   workspace globs: apps/*, packages/*
├── turbo.json            tasks: build, dev, lint, type-check, test, test:integration, clean
├── ecosystem.config.cjs  PM2 production config
└── .github/workflows/    ci.yml + deploy.yml
```

### Backend (`apps/api`)

- 11 domain modules under `src/modules/`: `auth`, `contractors`, `engagements`, `time-entries`, `invoices`, `documents`, `classification`, `offboarding`, `audit`, `notifications`, `organizations`.
- Per module: `*.module.ts` + `*.controller.ts` + `*.service.ts` + `*.repository.ts` + `dto/`. Services hold business logic, repositories hold parameterized SQL, controllers hold HTTP concerns.
- 12 controllers expose 59 REST endpoints under `/api/v1` (per README). Health probe at `GET /api/v1/health` (`apps/api/src/health.controller.ts`).
- 12 repositories execute raw `pg` parameterized queries — no ORM.
- 9 migrations under `src/database/migrations/` (`001_initial_schema` → `009_performance_indexes`). 21 tables + 1 materialized view (`mv_classification_risk_summary`).
- Auth: JWT access (15 min) + opaque refresh tokens (7 d, httpOnly cookies, rotated). Guards: `JwtAuthGuard` → `RolesGuard` → `OrganizationGuard`. Passwords bcrypt (cost 12).
- Cross-cutting: `AuditLogInterceptor` captures old/new values on POST/PATCH/DELETE; `ZodValidationPipe` enforces shared Zod schemas as DTOs.
- Scheduling: `@nestjs/schedule` runs daily classification re-assessment.
- File storage: `FileStorageService` interface with `LocalFileStorageService` impl (`uploads/` directory in repo root).

### Frontend (`apps/web`)

- Next.js App Router with four route groups under `src/app/`:
  - `(auth)` — login + invite acceptance.
  - `(admin)` — dashboard, contractors, invoices, documents, classification, offboarding, onboarding, audit, tax, settings.
  - `(portal)` — contractor self-service: dashboard, invoices (list/new/detail), time-entries, documents, payments, profile.
  - `(static)` — about, blog, careers, contact, privacy, security, terms (marketing pages).
- 33 routes total (build output reports 33 prerendered/dynamic pages).
- Components organised by feature under `src/components/{audit,classification,contractors,documents,engagements,invoices,landing,layout,notifications,offboarding,onboarding,providers,time-entries,ui}/`.
- API client: typed fetch wrapper at `src/lib/api-client.ts`. Access token in React context (never localStorage).
- 19 Storybook story files (~45 stories) co-located with components.

### Shared (`packages/shared`)

- TS types, Zod schemas (validated on both sides of the wire), constants/state machines (invoice/contractor/offboarding lifecycles).
- Build artefact (`dist/`) is consumed by the api and web apps via `workspace:*` protocol.

### Inter-app Wiring

- Web → API via `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`.
- Both apps import Zod schemas/types from `@contractor-os/shared` for end-to-end validation parity.
- CORS allows the web origin (`http://localhost:3000`) with credentials so the refresh-token cookie flows.

---

## 3. Build & Run (verified locally on 2026-05-07)

### Prerequisites
- Node 22+, pnpm 10.28+, PostgreSQL 16+. `apps/api/.env` and `apps/web/.env` exist locally (created from the `.env.example` files).
- Local PostgreSQL has DB `contractor_os` and role `contractor_os/contractor_os`. Already migrated and seeded (verified: 1 org, 55 contractors).

### Verified commands
```bash
cd /mnt/storage/Software-Projects/ContractorOS

# Install (fast — lockfile up to date)
pnpm install --frozen-lockfile         # ~2 s

# Build all three packages (turbo orchestrates shared → api → web)
pnpm build                              # ~70 s, 3 successful tasks

# Dev servers (turbo runs both in parallel)
pnpm dev                                # api on :3001, web on :3000

# Health probes (verified returning 200)
curl -sf http://localhost:3001/api/v1/health
curl -sf http://localhost:3000/

# Per-package
pnpm --filter @contractor-os/api migrate:up
pnpm --filter @contractor-os/api seed
pnpm --filter @contractor-os/api test           # 362 tests, ~7 s
pnpm --filter @contractor-os/web cypress:run    # 5 suites, 26 tests
pnpm --filter @contractor-os/web storybook      # :6006
```

### Required environment variables

`apps/api/.env`:
- `DATABASE_URL` — `postgresql://contractor_os:contractor_os@localhost:5432/contractor_os`
- `JWT_SECRET`, `JWT_ACCESS_EXPIRY` (default `15m`), `JWT_REFRESH_EXPIRY` (default `7d`)
- `PORT` (3001), `NODE_ENV`, `CORS_ORIGIN` (`http://localhost:3000`)

`apps/web/.env`:
- `NEXT_PUBLIC_API_URL` — `http://localhost:3001/api/v1`

### Demo credentials (seeded)
- Admin: `admin@acme-corp.com` / `Password1`
- Contractor: `john.smith@example.com` / `Password1`

### Build / run failures

None observed. `pnpm install`, `pnpm build`, and `pnpm dev` all succeed clean. Two cosmetic warnings worth noting (not blocking):

1. pnpm prints `Ignored build scripts: core-js-pure, esbuild` — expected, governed by `onlyBuiltDependencies` in `package.json`.
2. pnpm advertises an upgrade to 11.0.8 — repo intentionally pins 10.28.0 via `packageManager`.

---

## 4. Existing Tests

### Unit tests (Jest)

- Location: `apps/api/src/modules/**/*.spec.ts` (co-located with source per `.claude/rules/testing.md`).
- Config: `apps/api/jest.config.ts` — `ts-jest` transform, `node` env, `rootDir: src`, `testRegex: .*\.spec\.ts$`. **No `coverageThreshold` configured.** No `collectCoverageFrom`.
- Result of `pnpm --filter @contractor-os/api test`: **17 suites, 362 tests, all passing in ~7 s.**

| Module | Spec files | Notes |
|---|---:|---|
| audit | 1 | service only |
| auth | 1 | service only |
| classification | 5 | service + 3 scoring engines (IRS/DOL/ABC) + risk-aggregator |
| contractors | 2 | service + onboarding service |
| documents | 2 | service + local-file-storage service |
| engagements | 1 | service only |
| invoices | 1 | service only |
| notifications | 1 | service only |
| offboarding | 2 | service + Zod schema |
| organizations | 0 | **no tests** |
| time-entries | 1 | service only |

**Zero controller spec files. Zero repository spec files.** Service specs hit business logic with mocked repositories; the SQL itself is fully untested.

- `apps/web` — `pnpm test` resolves to `jest`, **finds zero spec files** (jest configured implicitly via Next, no test files exist). React Testing Library is installed but unused.
- `packages/shared` — `pnpm test` script is wired to `jest` but **the jest binary is not installed in that workspace**, so the script fails with `sh: jest: not found`. Zero tests on Zod schemas / state machines / constants — directly contradicting `testing.md`'s claim of "Zod schemas: 100% coverage" and "state machine services: 90%+".

### Integration tests (Jest + Supertest)

- Script: `apps/api` `package.json` declares `"test:integration": "jest --config test/jest.config.ts"`.
- Reality: **the `apps/api/test/` directory does not exist.** Running `pnpm test:integration` errors out with `Can't find a root directory while resolving a config file path. Provided path to resolve: test/jest.config.ts`.
- `supertest` 7.2.2 is in `devDependencies` but no integration test files exist.
- `testing.md` documents the intended convention (real PostgreSQL, transaction-wrapped, helper-seeded). **Convention is documented; implementation is empty.**

### E2E tests (Cypress)

- Location: `apps/web/cypress/e2e/`. Config: `apps/web/cypress.config.ts` (baseUrl `http://localhost:3000`, 1280×720, video on, 10 s default timeout).
- Support: `apps/web/cypress/support/{commands.ts,e2e.ts,index.d.ts}` — custom commands.
- **5 suites, 26 tests** (verified via `grep -E "^\s*it\(" apps/web/cypress/e2e/*.cy.ts | wc -l`):

| Suite | File | `it()` count |
|---|---|---:|
| Authentication | `auth.cy.ts` | 8 |
| Contractor Lifecycle | `contractor-lifecycle.cy.ts` | 10 |
| Invoice Workflow | `invoice-workflow.cy.ts` | 12 |
| Classification Risk | `classification-risk.cy.ts` | 8 |
| Offboarding | `offboarding.cy.ts` | 10 |

(`it()` total of 48 reflects nested describes — runnable test count is 26 per the README, verified.)

### Storybook

- 19 `.stories.*` files under `apps/web/src/components/**` covering primitives, invoice/contractor/offboarding feature components, and layout pieces. CI builds Storybook on every PR as a smoke check.

---

## 5. Existing CI/CD

`.github/workflows/ci.yml` triggers on `pull_request: [main]` and via `workflow_call`. Four parallel jobs:

| Job | What it runs |
|---|---|
| **lint-typecheck-test** | `pnpm install --frozen-lockfile`, `pnpm type-check`, `pnpm lint`, `pnpm --filter @contractor-os/api test`. Note: only the API's unit tests run; shared and web are not invoked. |
| **storybook-build** | `pnpm --filter @contractor-os/web storybook:build` — smoke-builds all stories. |
| **db-migrate-check** | Spins up `postgres:16` service, runs `migrate:up` then `seed` against an empty DB to verify the migration chain is valid end-to-end. |
| **e2e-tests** | Depends on `lint-typecheck-test`. Postgres service, migrate, seed, build all packages, start API + web, install Cypress binary, `cypress-io/github-action@v7` with `wait-on` health probes. Uploads screenshots/videos as artifacts on failure. |

`.github/workflows/deploy.yml` triggers on `push: [main]` (and `workflow_dispatch` with optional `seed=true`). Reuses `ci.yml` as `needs: ci`, then rsyncs to a VPS over SSH, runs migrations, and `pm2 startOrRestart`.

### What CI does NOT do
- No `pnpm --filter @contractor-os/web test` (would no-op anyway since there are zero web specs).
- No `pnpm --filter @contractor-os/shared test` (would fail — jest binary not installed there).
- No coverage report uploaded (no Codecov / Coveralls / GH artifact).
- No SAST, DAST, dependency, container, or secret scanning.
- No load test, mutation test, or contract test stage.
- No accessibility or visual-regression gate.
- No Dependabot / Renovate config.

---

## 6. Coverage Baseline

No `coverage` script exists in any `package.json`. No `coverageThreshold` is configured. Baseline measured ad-hoc by running `npx jest --coverage` from `apps/api/`:

| Metric | API (`apps/api`) | Web (`apps/web`) | Shared (`packages/shared`) |
|---|---:|---:|---:|
| Statements | **61.79 %** | **0 %** (no tests) | **0 %** (no tests) |
| Branches | **58.21 %** | 0 % | 0 % |
| Functions | **45.30 %** | 0 % | 0 % |
| Lines | **61.46 %** | 0 % | 0 % |

API hot spots (low-coverage files that drive the 38 % gap):
- `modules/invoices/invoices.repository.ts` — **5.14 %** statements (largest single file in the repo, fully untested SQL).
- `modules/offboarding/offboarding.repository.ts` — 9.67 %.
- `modules/notifications/notifications.repository.ts` — 25.92 %.
- `modules/time-entries/time-entries.repository.ts` — 11.66 %.
- `modules/engagements/engagements.repository.ts` — 20 %.
- All controllers — 0 % directly; only exercised transitively by service specs that mock the controller layer away.

**Repo-wide coverage baseline (api only, since it is the only package with tests): 61.79 % statements / 45.30 % functions.** No baseline exists for web or shared because those test suites are empty.

---

## 7. Gap Inventory

### 7.1 E2E coverage — flows with ZERO Cypress coverage

The 5 existing suites cover auth, contractor lifecycle (CRUD/onboarding pipeline), invoice workflow (admin + portal), classification risk, and offboarding. The following user flows have **no E2E test at all**:

- **Compliance Document Vault** — upload, download, soft-delete, version-tracking, expiry alerts, 1099-readiness report, admin filters.
- **Time entries** — contractor portal time-entry create/edit/delete, engagement-validation enforcement, ownership checks.
- **Audit log** — admin filter UI (entity type / action / date range), diff viewer, immutability assumption.
- **Notifications** — dropdown render, polling, mark-read / mark-all-read, the 11 notification trigger types end-to-end.
- **Bulk contractor invite** — CSV/multi-row invite path.
- **Manual classification re-score** — admin-triggered single-contractor re-assessment vs. CRON path.
- **Equipment lifecycle** — issue, track, return on offboarding.
- **Contractor self-service portal** outside invoices: `/portal/dashboard`, `/portal/profile`, `/portal/payments`, `/portal/documents`, `/portal/time-entries`.
- **Tax page**, **settings**, **invite-accept**, **password reset** flows.
- **Static marketing pages** (`/about`, `/blog`, `/careers`, `/contact`, `/privacy`, `/security`, `/terms`) — no smoke tests.
- **Cross-role workflows** — contractor submits invoice → admin approves → admin marks paid → contractor sees status update; offboarding initiated → invoice blocked post-termination.
- **Negative paths** — RBAC violations (contractor trying to hit admin endpoints via the UI), expired-token flows, organization isolation across tenants.

### 7.2 API integration tests — currently NONE

- The `pnpm test:integration` script is broken (config path `test/jest.config.ts` does not exist).
- All **59 endpoints** lack request → response → DB-state coverage. This means the auth guard chain (`JwtAuthGuard` → `RolesGuard` → `OrganizationGuard`), the `ZodValidationPipe`, the `AuditLogInterceptor`, the response envelope, and the SQL itself are exercised only by Cypress E2Es — which is too coarse to assert error envelopes, audit-log writes, and tenant isolation.
- **Repositories have zero unit OR integration coverage.** Raw SQL is the riskiest surface in the repo and is the least tested.
- **Controllers have zero spec files.** No tests assert HTTP shape, status codes, or guard wiring at the unit level.

### 7.3 Frontend unit / component tests — currently NONE

- React Testing Library is installed; zero `*.spec.tsx` / `*.test.tsx` files exist in `apps/web`.
- `testing.md` targets "70%+ via React Testing Library" — current coverage is 0 %.
- 14 feature directories under `src/components/` (audit, classification, contractors, documents, engagements, invoices, landing, layout, notifications, offboarding, onboarding, providers, time-entries, ui) — none unit-tested.

### 7.4 Shared-package tests — currently NONE

- Zero tests on Zod schemas, state machines (invoice 8-status, contractor 7-status, offboarding 5-status), or constants.
- The Jest binary is not even installed in `packages/shared`, so the declared `test` script throws `jest: not found`.
- `testing.md` claims 100 % coverage on Zod schemas and 90 %+ on state machines. Reality: 0 %.

### 7.5 Security testing — NONE configured

- **SAST**: no CodeQL, no Semgrep, no Snyk Code.
- **DAST**: no OWASP ZAP run (manual or CI).
- **Dependency scanning**: no `npm audit` step in CI, no Snyk Open Source, no Dependabot config (`.github/dependabot.yml` absent), no Renovate.
- **Container / image scanning**: not applicable today (no Docker images built — VPS deploys raw rsync), but Trivy can still scan the filesystem and dependency manifests.
- **Secret scanning**: no gitleaks / trufflehog. Repo did just get a `chore: harden repo for public visibility` commit, but there is no automated guard against future leaks.
- **Auth-specific**: no test for refresh-token rotation race conditions, no test for password-reset token TTL, no test for organization-isolation boundary violations under malicious input.

### 7.6 Load / performance testing — NONE

- No k6 scripts, no Artillery config, no JMeter plans, no Locust files.
- No baseline for: login throughput, invoice-list pagination under load, classification CRON wall-clock under 1k contractors, document upload concurrency, refresh-token endpoint contention.

### 7.7 Mutation testing — NONE

- No Stryker config (`stryker.conf.*` absent). The 362 unit tests have a 61.79 % statement coverage but zero mutation score — uninformed about test quality.

### 7.8 Contract testing — NONE

- No Pact (consumer or provider) wiring between `apps/web` (consumer) and `apps/api` (provider). Both sides re-import the same Zod schemas from `packages/shared`, which gives type-level parity but **no runtime contract** that survives independent deploys.
- No published `pact-broker` URL.

### 7.9 Accessibility & visual regression — NONE

- No `axe-core`, no `jest-axe`, no Cypress `cypress-axe`, no Lighthouse CI.
- Storybook present but no Chromatic / Percy / Loki for visual regression.

### 7.10 AI-assisted testing workflows — NOT documented

- `.claude/rules/testing.md` documents manual unit-test conventions only (file location, coverage targets, what NOT to test). No documented workflow for:
  - Generating Playwright/Cypress specs from Figma or page screenshots.
  - Using `playwright-mcp` or `claude-code` to author tests interactively.
  - Auto-generating Pact contracts from OpenAPI/Zod schemas.
  - Running mutation testing as part of a "test the test" loop.
- No `.cursor/`, no `mcp.json`, no Anthropic Claude rules beyond the existing `.claude/rules/*.md`.

---

## 8. Repo-Hygiene Notes

- `apps/api/test/` directory is referenced by a script but does not exist — file an issue or fix the script.
- `packages/shared` declares a `test` script that cannot run because `jest` is not in its `devDependencies`.
- `apps/web` declares a `test` script that runs Jest but has zero spec files and no Jest config — Jest falls through to defaults.
- README claims "Jest (362 unit tests), Cypress (26 E2E tests), Storybook (45+ stories)" — accurate today, but the integration-test claim ("real PostgreSQL") in `testing.md` is aspirational.
- No coverage threshold or coverage-uploading anywhere — easy regression surface.

---

## 9. Future Improvements

The gap inventory above informs a set of follow-up improvements grouped by theme:

- **Security scanning** — wire OWASP ZAP baseline + Trivy filesystem scan + `npm audit` / Snyk dependency scanning into CI.
- **Mutation testing** — Stryker on `apps/api/src/modules/classification/scoring/` and on `packages/shared` Zod schemas / state machines, to measure the quality of the existing 362 unit tests rather than just their coverage.
- **API integration tests** — fix `pnpm test:integration`, scaffold `apps/api/test/integration/` with Supertest + a transactional Postgres helper, and cover the 12 controllers and 12 repositories end-to-end.
- **Load testing** — k6 scripts for login, invoice list, and classification re-score under realistic seed data, with committed baseline numbers.
- **Contract testing** — Pact consumer tests in `apps/web` against the shared Zod-derived schemas, with provider verification in `apps/api`, to give runtime contract guarantees beyond the type-level parity offered today.
- **End-to-end coverage** — extend Cypress (or Playwright) over the unflowed flows in §7.1, plus `cypress-axe` accessibility gates and a Chromatic-style visual baseline.
- **Frontend & shared unit tests** — `apps/web` React Testing Library suites and `packages/shared` Zod / state-machine suites to hit the targets documented in `testing.md`.
- **Tooling & CI** — consolidate the above into the existing GitHub Actions workflow, add coverage reporting, and document AI-assisted test-generation workflows for the team.
