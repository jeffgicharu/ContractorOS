# QA Best Practices — ContractorOS

Conventions and rules for writing, reviewing, and maintaining tests in this repo. Companion to `TEST_STRATEGY.md` (the "what" and "why") and `TEST_PLAN.md` (the per-workflow scenarios). Where this document and `.claude/rules/testing.md` overlap, this document is authoritative.

---

## 1. Code Review Checklist

A reviewer should be able to merge a PR confidently after walking this list. Each item is binary — "yes" or "needs change." If a box is unchecked, the reviewer leaves a comment rather than guessing.

1. **Tests cover the change.** New behaviour has at least one test at the lowest level it can be tested at (a Zod schema bug → schema test, not E2E).
2. **Bug fixes ship with a regression test.** The test must fail against the unfixed code and pass after the fix. The PR description should reference the test by name.
3. **Tests assert on behaviour, not internals.** No `expect(spy).toHaveBeenCalledTimes(3)` when the count is incidental. No assertions on private method calls or rendered class names.
4. **Test names read as documentation.** A reader can understand the contract from the `describe` + `it` text alone, without opening the source.
5. **Real dependencies preferred over mocks.** Database tests use Testcontainers Postgres, not an in-memory fake. Component tests use MSW at the fetch boundary, not a mocked `api-client`.
6. **No `.skip`, `.only`, `xdescribe`, `xit` in committed tests.** A skipped test that has not been removed must link to an issue tracking its return.
7. **Test data is synthetic.** No emails outside the `*.test` TLD. No copied production rows. No real names that resemble real people.
8. **Determinism preserved.** No reliance on wall-clock time, network, random ordering, or timing without explicit faking. `Math.random` and `Date.now` are mocked or seeded.
9. **Single concern per test.** A test that asserts on three unrelated things should be three tests.
10. **Coverage thresholds respected.** No PR drops a package's coverage below the targets in `TEST_STRATEGY.md` §4 without a written justification.
11. **CI gates remain green for the right reasons.** A PR that re-enables a broken gate by lowering its threshold or by `// @ts-expect-error` is a red flag.
12. **Documentation updated when behaviour changes.** State-machine changes update `state-machines.ts` *and* the matching scenarios in `TEST_PLAN.md`. README claims about test counts stay accurate.

---

## 2. Test Naming Conventions

We write tests in BDD style. The result reads as English when scanned in the runner output.

### Structure

```ts
describe('<unit-under-test>', () => {
  describe('<method or behaviour>', () => {
    it('<expected behaviour in a complete sentence>', () => {
      // arrange
      // act
      // assert
    });
  });
});
```

### Examples (good)

```ts
describe('InvoicesService.submit', () => {
  it('rejects an invoice with no line items', () => { /* ... */ });
  it('writes an invoice_status_history row for the draft -> submitted transition', () => { /* ... */ });
  it('does not advance status when the contractor is offboarded', () => { /* ... */ });
});

describe('isValidTransition', () => {
  it('returns true for invoice draft -> submitted', () => { /* ... */ });
  it('returns false for invoice paid -> any status', () => { /* ... */ });
});
```

### Examples (bad — do not write)

- `it('works')` — says nothing.
- `it('test 1')` — numbered tests are a smell. Renumbering them on insertion is a maintenance tax.
- `it('should successfully submit an invoice')` — the word "should" is filler, "successfully" is a tautology. Prefer `it('submits a draft invoice with one line item')`.
- `describe('InvoicesService', () => it('submit works for valid input', ...))` — the `describe` should name the method, and the `it` should describe the specific case.

### Style rules

- `describe` names the unit under test (a service, a component, a function).
- Nested `describe` names the method or behavioural area.
- `it` reads as a complete sentence describing the *expected* behaviour. Use the present tense ("returns", "rejects", "advances"), not the imperative ("should return").
- One assertion topic per test. Multiple `expect()` calls are fine when they assert on different facets of the same behaviour (status code + body shape + audit row).

---

## 3. Test Independence

Every test must be runnable in isolation and in any order. The runner is allowed to shuffle tests, parallelise suites, and re-run individual files.

- **No shared mutable state between tests.** Each test sets up the entities it needs and tears them down (or relies on the transaction rollback mechanism for integration tests).
- **No reliance on test ordering.** A test that only passes when run after another test is broken.
- **No global singletons unless explicitly reset.** A service that holds state across tests must expose a `reset()` hook or be re-instantiated in `beforeEach`.
- **Don't fetch real time.** Use `jest.useFakeTimers()` (api) or `vi.useFakeTimers()` (web/shared). Document the wall-clock time being simulated in a comment when it matters.
- **Don't share fixtures across unrelated suites.** A "user-fixture" used by both auth and invoices tests is a coupling waiting to break. Each suite builds the entities it owns.
- **Mock the network at one boundary only.** In component tests, MSW. In api tests, the in-process fake transport. Mixing approaches per file makes failures hard to trace.

---

## 4. Flaky Test Policy

A flaky test is a test that fails non-deterministically — i.e., its pass/fail outcome on a given commit is not stable. Flakiness is a high-cost defect: it teaches the team to ignore CI, which masks real regressions.

### Definition

A test is flaky if it has failed at least once in the last 20 runs on `main` without an associated code change. We track this via CI run history (GitHub Actions `re-run failed jobs` events plus a weekly aggregation).

### Quarantine

When a test is identified as flaky:

1. The test is tagged with the `quarantined` annotation (Jest: a custom describe wrapper that runs the test but does not fail the build on a non-deterministic result; Cypress: an `@quarantined` tag with `cypress-grep` exclusion in PR runs).
2. An issue is opened titled `Flaky: <test-id>` linking to the failing run, with the assignee being whoever last touched the test or its surrounding code.
3. The test continues to run nightly so we keep visibility, but it stops blocking PRs.

### 48-hour fix SLO

The owner has **48 working hours** from quarantine to either fix the test or delete it. If neither happens, the test is deleted on the third day. Quarantining without a fix is not a long-term resting state — flaky tests in quarantine for weeks erode trust as much as flaky tests in CI.

### Acceptable reasons to delete

- The test was asserting on incidental behaviour that has since changed.
- The test depends on a system we no longer use or cannot stabilise (e.g., a third-party service we have stopped integrating with).
- A higher-level test now covers the same scenario more reliably.

Never delete a test purely to make CI green. Replace it with a smaller, deterministic version at the same or a lower level.

---

## 5. Mock vs Real Dependencies

Default to real. Mock only at boundaries we do not own and cannot run cheaply in tests.

### When to use a real dependency

- **Postgres**: always real, via Testcontainers or the CI service container. Never SQLite, never an in-memory shim.
- **Redis** (when added): same — real container.
- **Internal services / modules**: always real. If `InvoicesService` calls `NotificationsService`, the test wires them up together. The seam is mocked only when:
  - The collaborator's behaviour is not relevant to the test under assertion (rare), or
  - The collaborator has a real-money / real-world side effect (sending a paying user an email, charging a card).
- **Filesystem / local file storage**: real, against a temp directory. The `LocalFileStorageService` test asserts on bytes on disk.
- **Time**: real wall-clock until a test specifically needs to control it. Then a fake timer is local to that test.

### When to mock

- **Outbound mail / SMS / paid notification providers**: an in-process fake transport; we assert on what would have been sent.
- **Outbound webhooks to third-party services**: an in-process fake or `nock`. Never hit the live URL.
- **Payment processors** (when added): a sandboxed stub. Never the live API.
- **Identity providers** (when added): the IdP's own test instance, not the production tenant.
- **The wall clock**: only when the behaviour under test is time-dependent (token expiry, schedule windows, scheduled CRONs).
- **`Math.random` / cryptographic randomness in tests**: stubbed with a deterministic seed when output stability matters.

### Never mock

- Zod schemas. They are pure logic — test them directly.
- State machines. Same.
- Repositories in their own integration tests. The whole point of an integration test is to exercise the SQL.
- The HTTP request/response cycle when integration-testing controllers — supertest exercises the real Nest pipeline.

If you find yourself writing a mock for an internal seam to "make the test simpler," that is a signal the test is at the wrong level of the pyramid. Move it down (more unit) or up (more integration).

---

## 6. Commit Conventions for Tests

Test commits follow Conventional Commits with a `test` type and a scope. The scope identifies *which* test layer the commit changes.

| Prefix | Use For |
|---|---|
| `test(api):` | api Jest unit, integration (Testcontainers + supertest), or scoring tests |
| `test(web):` | web Vitest unit or React Testing Library component tests |
| `test(shared):` | tests on Zod schemas, state machines, or constants in `packages/shared` |
| `test(e2e):` | Cypress end-to-end tests |
| `test(perf):` | k6 scripts or performance budgets |
| `test(security):` | OWASP ZAP, Trivy, Snyk, CodeQL, or dependency-review configuration |
| `test(contract):` | Pact consumer tests or provider verification |
| `test(a11y):` | axe-core / cypress-axe rules |
| `test(mutation):` | Stryker config or mutation-test additions |

A commit that only adds or updates tests uses one of these prefixes. A commit that adds tests alongside a feature uses the feature prefix (`feat:`, `fix:`) and mentions the tests in the body. Don't split a feature into "feat + test" commits unless the test is large enough to deserve its own commit.

### Examples

- `test(api): cover invoice draft -> submitted state transition`
- `test(e2e): add accessibility scan to onboarding pipeline page`
- `test(security): wire OWASP ZAP baseline scan into nightly cron`
- `fix(api): reject invoice submission with zero line items` (the body mentions: "adds INV-02 regression test")

---

## 7. PR Requirements

A PR is mergeable when **all** of the following hold. The reviewer is responsible for catching items the author missed.

1. **Tests for new features.** Every code path the feature introduces is exercised by at least one test at the appropriate layer.
2. **Regression test required for any bug fix.** The test must reproduce the bug on the unfixed code (red) and pass after the fix (green). The PR description quotes the test name.
3. **No `.skip`, `.only`, or `xdescribe` without an issue link.** A `it.skip(..., '#1234 — intermittent timeout')` is acceptable; an unannotated skip is not.
4. **Coverage does not regress** below the package targets in `TEST_STRATEGY.md` §4. CI enforces this; a deliberate drop requires a comment in the PR explaining why.
5. **No new accessibility violations.** axe-core gates on the changed pages must be clean. Existing violations are not the PR author's responsibility unless the PR touches the offending code.
6. **No new high/critical CVEs introduced.** Snyk and Dependency Review must be clean before merge.
7. **Storybook stories updated** when a component's API changes (props added, defaults changed, states added).
8. **`TEST_PLAN.md` updated** when a workflow's covered behaviour changes — the scenario tables are expected to evolve with the code.
9. **CI is green for the right reasons.** Re-running flaky CI to make it pass is a quarantine candidate, not a merge tactic.
10. **The PR description names the testing strategy.** One line: "Tested at: unit (Jest) + integration (Testcontainers) + E2E (Cypress)." If a layer is skipped, the description says why.

---

## 8. Onboarding — How to Run Tests, Read Failures, and Get Help

### Running the suite locally

```bash
# Install (one-time)
pnpm install

# Fast loop — run while developing
pnpm --filter @contractor-os/api    test --watch
pnpm --filter @contractor-os/web    test --watch
pnpm --filter @contractor-os/shared test --watch

# Whole package
pnpm --filter @contractor-os/api test
pnpm --filter @contractor-os/web test

# Integration suite (api, requires Docker for Testcontainers)
pnpm --filter @contractor-os/api test:integration

# E2E (requires the api + web running, or use the Cypress CI runner)
pnpm --filter @contractor-os/web cypress:open  # interactive
pnpm --filter @contractor-os/web cypress:run   # headless

# Coverage
pnpm --filter @contractor-os/api test -- --coverage
pnpm --filter @contractor-os/web test -- --coverage

# Storybook (visual catalogue)
pnpm --filter @contractor-os/web storybook
```

A single test file:

```bash
pnpm --filter @contractor-os/api test -- src/modules/invoices/invoices.service.spec.ts
```

A single test by name:

```bash
pnpm --filter @contractor-os/api test -- -t 'rejects an invoice with no line items'
```

### Reading a CI failure

CI failures land as a check run on the PR. Click into the failing job and:

1. **Look at the summary block first.** GitHub Actions surfaces the failed step's name and the tail of its log.
2. **Find the first failing test, not the last.** A cascade of failures usually traces back to one root cause near the top of the log.
3. **Check artifacts on the run page.** Cypress uploads screenshots and videos on failure (`apps/web/cypress/screenshots`, `apps/web/cypress/videos`). They are usually faster than reading the log.
4. **Reproduce locally before debugging in CI.** A test that fails in CI but passes locally is either flaky (open a quarantine issue) or environment-dependent (check Postgres version, Node version, env vars).
5. **For coverage failures**, the threshold breach lists which file regressed and by how much. Add tests there or write a justification.
6. **For Pact provider verification failures**, the log includes the mismatching field path; fix either the api response or the consumer expectation, depending on which side moved.

### Getting help

- **Test strategy questions** (which layer to test at, when to use a real DB) → `TEST_STRATEGY.md` first; ask in the team channel if still unclear.
- **A specific scenario in `TEST_PLAN.md`** → comment on the line in the rendered doc on GitHub; add a `?` in PR review if a scenario is ambiguous.
- **Flaky tests** → open an issue with the `flaky` label, link the failing run, page the test's owner via git blame.
- **Tooling problems** (Testcontainers won't start, Cypress times out) → check Docker is running, then the team channel; do not silence the test.
- **Coverage and threshold disputes** → discuss in the PR review with a reviewer; thresholds are set deliberately and should not be lowered casually.

A useful general rule: if you have spent more than 30 minutes stuck on a test problem alone, ask. The team's collective time is cheaper than your individual time.
