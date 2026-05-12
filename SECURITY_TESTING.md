# Security Testing — ContractorOS

This document describes how ContractorOS is tested for security: what the threat model is, which tools cover which class of issue, where each tool runs, how findings are triaged, and how to add a new security test.

---

## Threat model

A condensed view of the assets the api protects, the threats against them, the mitigation in place, and the test/tool that exercises that mitigation.

| Asset | Threat | Mitigation | Where covered |
|---|---|---|---|
| Cross-tenant data | One org reading or writing another org's contractors / invoices / engagements | `OrganizationGuard` + repository SQL parameterised on `orgId` | `apps/api/test/integration/multi-tenant.int-spec.ts` + `apps/api/test/security/rbac.sec-spec.ts` |
| Privileged actions | Contractor escalating to admin actions | `RolesGuard` + `@Roles()` decorator on every state-changing route | `apps/api/test/security/rbac.sec-spec.ts` |
| Forged credentials | JWT signed with the wrong key, expired, tampered, alg=none | `passport-jwt` strategy + Nest `JwtAuthGuard` | `apps/api/test/security/auth.sec-spec.ts` (8 tests) |
| Credential exposure | Password hashes / JWT secrets in responses or audit log | Repository projection drops `password_hash` everywhere; audit interceptor strips known-sensitive keys | `apps/api/test/security/sensitive-data.sec-spec.ts` |
| Injection | SQL injection in path/query/body | `pg` parameterised queries; `ZodValidationPipe` on every input | `apps/api/test/security/injection.sec-spec.ts` |
| Mass assignment | Attacker-supplied `is_admin` / `organization_id` overwriting privileged fields | DTO Zod schemas drop unknown fields; service code uses an allow-list before persisting | `apps/api/test/security/injection.sec-spec.ts` |
| Path traversal | `../../../etc/passwd` style payloads in document download | Document service validates UUID + uses an opaque storage key | `apps/api/test/security/injection.sec-spec.ts` |
| Dependency CVEs | Known vulnerabilities in transitive packages | Snyk + pnpm audit + Trivy on PR + cron | `.github/workflows/dependency-snyk.yml`, `.github/workflows/dependency-audit.yml`, `.github/workflows/container-scan.yml` |
| OS / image CVEs | Vulnerable base image or system libraries | Trivy image scan against the production Dockerfile | `.github/workflows/container-scan.yml` |
| Secret leakage | API keys / tokens in source / lockfiles / IaC | Trivy `fs` scan with secret + misconfig scanners | `.github/workflows/container-scan.yml` |
| Code-level vulns | Insecure patterns in TypeScript (eval, regex DoS, etc.) | GitHub CodeQL with `security-extended` query suite | `.github/workflows/codeql.yml` |
| Runtime vulns | OWASP top-10 issues a static tool can't see (XSS reflection, security headers, …) | OWASP ZAP baseline + API scan against the running api | `.github/workflows/dast-zap.yml` |
| Brute-force / abuse | Credential stuffing, token enumeration | Auth path stays stable under burst (no 5xx); rate limiter is a backlog item — see issue #11 from PR #13 | `apps/api/test/security/abuse.sec-spec.ts` |

---

## Tooling overview

| Layer | Tool | Where | Frequency | Action on HIGH/CRITICAL |
|---|---|---|---|---|
| **SAST** | GitHub CodeQL (`security-extended` query suite) | `.github/workflows/codeql.yml` | every PR + push to main + weekly Mon 03:17 UTC | Fails the PR; finding lands in Security tab |
| **Dependency** | Snyk (preferred when `SNYK_TOKEN` is configured) | `.github/workflows/dependency-snyk.yml` | every PR + weekly Mon 04:23 UTC | Fails the PR |
| **Dependency** | `pnpm audit --audit-level=high` (always-on fallback) | `.github/workflows/dependency-audit.yml` | every PR + daily 04:47 UTC | Fails the PR |
| **Container** | Trivy image scan against `apps/api/Dockerfile` | `.github/workflows/container-scan.yml` | every PR + push to main + daily 05:13 UTC | Fails the PR; SARIF lands in Security tab |
| **Filesystem / secrets / IaC** | Trivy `fs` scan with `vuln,secret,misconfig` scanners | `.github/workflows/container-scan.yml` | same as above | Fails the PR; SARIF lands in Security tab |
| **DAST** | OWASP ZAP API scan + baseline against the running api | `.github/workflows/dast-zap.yml` | weekly Mon 06:07 UTC + manual `workflow_dispatch` | Advisory artefact (HTML+JSON) — too slow for per-PR |
| **Custom suite** | Jest + Testcontainers (`apps/api/test/security/`) | `.github/workflows/ci.yml` (api integration job) | every PR + push to main | Fails the PR |

---

## Where findings appear

- **GitHub Security tab → Code scanning alerts**: CodeQL + Trivy SARIF uploads land here. Filterable by severity. Each alert links to the rule and the offending source location.
- **GitHub Actions run page**: per-job logs for CodeQL, Trivy, audit, ZAP. Artifacts (HTML reports) downloadable for 30 days.
- **Snyk dashboard** (when `SNYK_TOKEN` is configured): https://app.snyk.io/. Per-project view + remediation PRs.
- **GitHub Issues with `security` label**: anything that needs human triage gets filed, with hypothesis + suggested fix area.
- **The `apps/api/test/security/` suite output**: a failing test in this suite is a security regression. Filed as an issue too (see process below).

---

## Triage SLO

When a HIGH or CRITICAL finding appears:

| Step | Owner | SLO |
|---|---|---|
| Acknowledge (open / re-open / triage the GitHub issue) | On-call engineer | **24 hours** |
| Resolve (merge a fix, lift the threshold, or document an accepted risk) | The engineer who triaged | **7 calendar days** |

If a CRITICAL is open at the start of a release cycle, it blocks the release. HIGHs can ship if the team has a written justification on the issue ("transitive in dev-only path", "no plausible reach", etc.).

---

## How to add a new security test

1. Pick the right category — auth/JWT, RBAC, injection, abuse, or sensitive-data — and place the test under `apps/api/test/security/<category>.sec-spec.ts`. Don't create a new top-level file unless none of the existing categories fits.
2. Follow the existing pattern: `createTestApp()` + `resetDatabase()` in `beforeEach` + factories from `test/factories/`. The Testcontainers Postgres is shared with the integration suite — no additional setup required.
3. Name the test as a complete sentence describing the safety property. Example: `it('rejects a JWT for a user that has been deactivated', …)`. The test name should read as a security assertion.
4. Run `pnpm --filter @contractor-os/api test:security` locally and confirm it passes.
5. If the test fails because the api does not yet enforce the property, that is a **finding** — file it as a GitHub issue with the `security` label, then loosen the test assertion to the current behaviour with a comment pointing to the issue, so the suite stays green and the issue tracks the gap.

The naming convention is `*.sec-spec.ts` so the security jest config (`apps/api/test/security/jest.config.ts`) discovers them; the integration suite uses `*.int-spec.ts` and they don't collide.

---

## Reading and acting on a finding

### CodeQL or Trivy alert in the Security tab

1. Open the alert. It shows the rule, severity, the file + line, and a description of the weakness.
2. Decide: real bug, false positive, or accepted-with-justification?
3. If real: open or update a GitHub issue (label: `security`, plus an area label: `api` / `web` / `dependency` / `container`), reference the alert URL, fix on a branch, link the PR.
4. If false positive: dismiss the alert with a short reason. Don't dismiss without a reason — that loses the audit trail.

### Snyk / pnpm audit failing the PR

1. Read which package + advisory is flagged. Open the GHSA link.
2. Check whether the advisory is reachable via your code or only transitively in a dev path.
3. If reachable: bump the direct dependency, or add an entry to `pnpm.overrides` in the root `package.json` to pin a fixed transitive.
4. If only transitive in a dev path with no plausible reach: add an audit ignore with an expiry date and a comment.

### Failing test in `apps/api/test/security/`

A failing security test is the most actionable signal — it represents a verified, reproducible safety-property violation. Treat it as a HIGH unless the test's framing says otherwise.

---

## OWASP Top 10 — 2021 mapping

For each OWASP category, which tool / test in this repo covers it.

| OWASP | Category | Coverage |
|---|---|---|
| A01 | Broken Access Control | `apps/api/test/security/rbac.sec-spec.ts` (RBAC + multi-tenant); `apps/api/test/integration/multi-tenant.int-spec.ts` |
| A02 | Cryptographic Failures | `apps/api/test/security/sensitive-data.sec-spec.ts` (no `password_hash` in responses, HttpOnly cookies); CodeQL `security-extended` queries |
| A03 | Injection | `apps/api/test/security/injection.sec-spec.ts` (SQL in path/query/body, mass-assignment, path traversal); CodeQL TS injection rules; ZAP active scan |
| A04 | Insecure Design | Threat model in this document + design rules in `.claude/rules/backend.md`; partially covered — best caught by code review |
| A05 | Security Misconfiguration | Trivy `fs` scan (IaC misconfigs, secrets); ZAP baseline (security headers); container scan (insecure base image) |
| A06 | Vulnerable & Outdated Components | Snyk + `pnpm audit` + Trivy image scan |
| A07 | Identification & Authentication Failures | `apps/api/test/security/auth.sec-spec.ts` (8 JWT-related tests); ZAP API scan |
| A08 | Software & Data Integrity Failures | Trivy filesystem scan (lockfile + secrets); CodeQL deserialisation rules |
| A09 | Security Logging & Monitoring Failures | `apps/api/test/security/sensitive-data.sec-spec.ts` (audit_events does not capture passwords); covered transitively by audit-log integration tests in PR #4 |
| A10 | Server-Side Request Forgery | CodeQL SSRF rules; partial — no dedicated test today (the api makes few outbound HTTP requests) |

---

## Quick reference — running each tool locally

```bash
# Custom security suite
pnpm --filter @contractor-os/api test:security

# Combined: unit + integration + security
pnpm --filter @contractor-os/api test:all

# Dependency audit (fast, no token required)
pnpm audit --audit-level=high

# Trivy filesystem scan
trivy fs --severity HIGH,CRITICAL --skip-dirs node_modules,coverage,.next,dist .

# Trivy image scan (after building the api image)
docker build -t contractor-os-api:scan -f apps/api/Dockerfile .
trivy image --severity HIGH,CRITICAL contractor-os-api:scan

# OWASP ZAP API scan against a running api
docker compose -f docker-compose.perf.yml up -d
docker run --network=host --rm -v $(pwd)/security/zap:/zap/wrk/:rw \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t http://localhost:3001/api/v1/health -f openapi -r api-scan-report.html
```
