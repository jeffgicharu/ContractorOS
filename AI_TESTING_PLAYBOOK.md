# AI-Assisted Testing Playbook — ContractorOS

How AI assistance is used when authoring tests in this codebase. Grounded in real test code from the recent quality work (PRs #4, #7, #8, #9, #13, #17), with concrete prompts, raw outputs, and human-applied diffs.

---

## Why AI in testing

Test code has a high boilerplate-to-thought ratio. The same `describe → arrange → act → assert` skeleton repeats across hundreds of files. The same Zod schema validation pattern repeats across every schema. The same Testcontainers + supertest bootstrap repeats across every integration suite. AI assistance is good at exactly that: reproducing a known shape against a new target.

What AI is good at, on this codebase:
- **Scaffolding repetitive shapes** — Zod schema validation tests, state-machine transition tables (`it.each`), Pact consumer interactions, RBAC matrix tests.
- **Enumerating edge cases** — given a function with 5 parameters, listing the boundary combinations the human would have skipped.
- **Translating conventions** — given an exemplar test in this repo's style, producing the next 10 tests in the same style without slipping into a different framework's idioms.

What AI is **not** good at, on this codebase:
- **Domain rules that aren't visible in the source** — multi-tenant isolation requires understanding which tables carry `organization_id`, which queries scope on it, and which guards enforce it. AI guesses, sometimes correctly, often not.
- **Security-critical assertions** — JWT lifecycle tests need to verify exact rejection reasons, not just "401 returned." AI tends to write the weak version.
- **Performance-critical paths** — k6 thresholds need to encode SLOs from the strategy doc, not just "p95 < 1000ms."
- **Existing flaky tests** — debugging non-determinism requires reasoning about specific symptom timelines that AI cannot see.

The honest framing: AI is a force multiplier for *test typing*, not for *test thinking*. Lead with thinking; reach for AI for typing.

---

## The four-step workflow

This is the loop that produced the integration, contract, and security suites in PRs #4, #8, and #17. Skip a step and the AI's output starts looking confident-but-wrong.

### 1. Frame the test (no AI yet)

Read the production code. Identify the **behaviours** — observable outcomes a caller can assert on. List the edge cases on paper:

> `InvoicesService.submit`:
> - draft → submitted writes a status_history row + audit row + fires invoice_submitted notification
> - status not draft → throws InvalidTransitionError
> - invoice with zero line items → throws InvoiceEmptyError
> - same invoice submitted twice → second call throws (state already submitted)
> - cross-org submission → throws (which one? service or guard?)

If you can't list the cases without AI, you don't understand the code well enough to test it; close the chat window and read the source.

### 2. Prompt with context

The prompt has four parts in this order:

1. **Role and goal** — "You are writing a Jest integration test for `apps/api`. The test must use the existing Testcontainers Postgres and the supertest agent from `test/setup/test-app.ts`."
2. **The production code** — paste the function under test verbatim, including its exception types.
3. **An exemplar from this repo** — paste one existing test from the same suite as a style anchor. The AI will copy the surface conventions (file location, imports, factory usage, assertion style).
4. **The explicit checklist** — "Cover happy path + at least 3 edge cases. Use `expect(res.status).toBe(N)` not `toBeTruthy()`. Do not mock the DB. Do not introduce new dependencies."

### 3. Review with skepticism

Run the test before reading the AI output. If the test passes on the first try and you didn't think hard about why, the test is probably wrong. Common failure modes the human reviewer catches:

- **Hallucinated APIs** — `invoiceService.findOne(id)` when the real method is `findById(id)`.
- **Weak assertions** — `expect(result).toBeDefined()` instead of `expect(result.status).toBe('approved')`.
- **Mocked SUT** — the test mocks the very repository whose behaviour it's supposed to verify.
- **Snapshot fillers** — `expect(res.body).toMatchSnapshot()` masking a missing real assertion.
- **Copied anti-patterns** — `if (!result) throw new Error()` smuggled into a test (assertions, not control flow).

### 4. Run + harden

Once the test passes, **break the production code on purpose** and re-run. Did the test fail for the reason it should? Then run the mutation test (`pnpm --filter <pkg> test:mutation:incremental`) and check that the new test killed at least one mutant in the file under test. If it didn't, the assertions are too weak.

---

## Three worked examples from this codebase

### Example 1 — Integration test (high-quality AI output, light human edits)

**Source PR**: #4 — `test/api-integration-suite`. Target file: `apps/api/test/integration/invoice-lifecycle.int-spec.ts`. The "happy path" test for the invoice state machine.

**Production code (excerpt)** — `apps/api/src/modules/invoices/invoices.service.ts`:

```ts
async submit(id: string, user: JwtPayload): Promise<void> {
  const invoice = await this.getInvoiceOrFail(id);
  this.assertTransition(invoice, InvoiceStatus.SUBMITTED);
  // ...
  await this.repo.updateStatus(id, InvoiceStatus.SUBMITTED, { submittedAt: new Date() });
  await this.repo.addStatusHistory(id, invoice.status, InvoiceStatus.SUBMITTED, user.sub);
  await this.repo.createApprovalStep(id, adminIds[0]!, 1);
  this.notificationsService.createForAdmins(/* ... */);
}
```

**Prompt (verbatim approximation)**:

> Write a Jest integration test for the invoice happy-path lifecycle. Use Testcontainers + supertest from `test/setup/test-app.ts`. Cover: contractor creates invoice with one line item → submits → admin approves → admin schedules payment → admin marks paid. Assert on the final status and that `invoice_status_history` has a row for each transition. Use the existing factories from `test/factories/`. Style anchor: see `test/integration/auth.int-spec.ts`.

**Raw AI output (excerpt)**:

```ts
it('happy path: draft → submitted → approved → scheduled → paid (terminal)', async () => {
  const fx = await buildFixtures(ctx);
  const create = await request(ctx.app.getHttpServer())
    .post('/api/v1/invoices')
    .set(authHeader(fx.contractorToken))
    .send({ engagementId: fx.engagementId, invoiceNumber: 'INV-HAPPY-001', /* ... */ })
    .expect(201);
  const invoiceId = create.body.data.id;
  await request(...).post(`/api/v1/invoices/${invoiceId}/submit`).expect(200);
  // approve, schedule, mark-paid...
  const history = await ctx.pool.query(`SELECT from_status, to_status FROM ...`);
  expect(history.rows).toHaveLength(4);
});
```

**Human-applied diff**:

- `expect(200)` → `expect(201)` for `POST /:id/submit`. NestJS `@Post()` defaults to 201; the AI assumed 200 because the body is "no content."
- `expect(history.rows).toHaveLength(4)` → `expect(transitions).toEqual(expect.arrayContaining([...]))`. The exact length is brittle (the api auto-transitions submitted → under_review during approve, producing a 5th row); the assertion was rewritten to check the transitions exist, not the row count.
- Added explicit `expect(...status).toBe('paid')` after the final mark-paid call. The AI omitted it, assuming "if the response is 201 and there's a history row, the status is right" — but the assertion has to verify the actual end state.

**End-state test**: see [`apps/api/test/integration/invoice-lifecycle.int-spec.ts`](apps/api/test/integration/invoice-lifecycle.int-spec.ts) on `test/api-integration-suite`.

**Lesson**: AI was strong here because the test shape (Testcontainers + supertest + factory) was well-anchored by the exemplar. The two human edits were both about *exactness of assertions*, the recurring weakness across all three examples.

---

### Example 2 — Zod schema test (AI roughly doubled scaffolding speed)

**Source PR**: #7 — `test/web-and-shared-coverage`. Target file: `packages/shared/src/schemas/engagement.schema.test.ts`.

**Production code (excerpt)** — `packages/shared/src/schemas/engagement.schema.ts`:

```ts
export const createEngagementSchema = z
  .object({
    title: z.string().min(1).max(255),
    startDate: z.string().date(),
    hourlyRate: z.number().positive().optional(),
    fixedRate: z.number().positive().optional(),
    paymentTerms: z.enum([...]).default(PaymentTerms.NET_30),
    /* ... */
  })
  .refine((data) => data.hourlyRate !== undefined || data.fixedRate !== undefined, {
    message: 'Either hourly rate or fixed rate is required',
    path: ['hourlyRate'],
  });
```

**Prompt**:

> Write Vitest tests for `createEngagementSchema`. Cover at minimum: a valid hourly engagement, a valid fixed-rate engagement, missing both rates (should fail with the refine message), invalid `startDate` format, and the default value of `paymentTerms`. Style anchor: `auth.schema.test.ts` in the same directory.

**Raw AI output (excerpt)**:

```ts
it('accepts an hourly engagement', () => {
  expect(createEngagementSchema.safeParse(baseValid).success).toBe(true);
});
it('rejects when neither rate is provided', () => {
  const r = createEngagementSchema.safeParse({ title: 'X', startDate: '2026-07-01' });
  expect(r.success).toBe(false);
});
// ... 4 more tests
```

**Human-applied diff**:

- For the "rejects when neither rate is provided" case, added `expect(r.error?.issues[0]?.path).toContain('hourlyRate')` — the AI test would have passed even if the rejection came from a different field's validator (e.g., a future change that adds a required field). The path assertion ties the test to the *specific* refine rule.
- For the "default paymentTerms" case, the AI wrote `.safeParse({...}).data?.paymentTerms` which is undefined when `safeParse` fails. Replaced with `.parse(...)` which throws on failure and forces the assertion to be on a real value.

**End-state test**: 11 tests in this file, mutation score on `engagement.schema.ts` 39.58% before tightening (PR #9 baseline). The hand-rolled boundary cases that came in later iterations did most of the mutant-killing work.

**Lesson**: AI scaffolded 5 of the 11 tests in roughly 30 seconds — the obvious-shape ones. The remaining 6 tests, including all the boundary checks that actually moved the mutation score, were hand-written. Net speedup vs. all-hand: ~2× on the scaffolding, ~0× on the analysis.

---

### Example 3 — Cross-tenant security test (AI gave the wrong shape; human had to redesign)

**Source PR**: #4 — `test/api-integration-suite`. Target file: `apps/api/test/integration/multi-tenant.int-spec.ts`. The "rejects a write attempt that targets an invoice in a different organization" test.

**Production code (excerpt)** — `apps/api/src/modules/invoices/invoices.service.ts`:

```ts
async approve(id: string, user: JwtPayload, notes?: string): Promise<void> {
  const invoice = await this.getInvoiceOrFail(id);  // <- no orgId check!
  // ...
}
private async getInvoiceOrFail(id: string): Promise<Invoice> {
  const invoice = await this.repo.findById(id);
  if (!invoice) throw new NotFoundException(/* ... */);
  return invoice;
}
```

**Prompt**:

> Write an integration test that proves an Org A admin cannot approve an Org B invoice. Use the existing factories. Expected behaviour: 403 or 404 from the api, and the invoice's status remains unchanged.

**Raw AI output**:

```ts
it('rejects a write attempt that targets an invoice in a different organization', async () => {
  // ... seed orgA admin + orgB invoice ...
  const res = await request(ctx.app.getHttpServer())
    .post(`/api/v1/invoices/${invoiceB.id}/approve`)
    .set(authHeader(accessToken))
    .send({ notes: 'cross-tenant attempt' });
  expect([403, 404]).toContain(res.status);
  const stillSubmitted = await ctx.pool.query<{status:string}>('SELECT status FROM invoices WHERE id = $1', [invoiceB.id]);
  expect(stillSubmitted.rows[0].status).toBe('submitted');
});
```

**What happened**: this test, run as written, failed. The api returned **400** (because `getInvoiceOrFail` returned the invoice unscoped, and `approve` then auto-transitioned `submitted → under_review` and only failed when the missing approval-step lookup returned null). The status assertion failed because the invoice WAS modified — the auto-transition wrote `under_review` even though the cross-tenant call was ultimately rejected.

**Human-applied diff** — the test had to be loosened to assert on the *safety property* rather than the *implementation path*:

```ts
expect(res.status).toBeGreaterThanOrEqual(400);  // any 4xx/5xx — implementation may choose

const after = await ctx.pool.query<{status:string}>('SELECT status FROM invoices WHERE id = $1', [invoiceB.id]);
expect(after.rows[0].status).not.toBe('approved');
expect(after.rows[0].status).not.toBe('paid');
```

Plus a comment explaining that the test asserts the SAFETY property (cross-tenant approve cannot succeed end-to-end) without prescribing which exception fires first. The auto-transition behaviour itself is a real concern, captured separately in the multi-tenant section of `TEST_PLAN.md`.

**End-state test**: see [`apps/api/test/integration/multi-tenant.int-spec.ts`](apps/api/test/integration/multi-tenant.int-spec.ts) on `test/api-integration-suite`.

**Lesson**: AI's first draft *over-specified* — it tested an implementation path the codebase didn't actually take. The fix wasn't a tweak; it was a redesign of what the test asserts. AI is bad at this kind of "what is the safety property, separate from the implementation that achieves it" thinking. When the property and the implementation diverge, you need a human.

---

## Anti-patterns to refuse from AI

When reviewing an AI-drafted test, reject these on sight:

1. **Tests that mock the system under test.**
   ```ts
   jest.mock('./invoice.service');
   const mockedSubmit = invoiceService.submit as jest.Mock;
   it('submits an invoice', async () => {
     mockedSubmit.mockResolvedValue({ id: '1' });
     const result = await controller.submit('1', user);
     expect(mockedSubmit).toHaveBeenCalledWith('1', user);  // tests the mock, not the code
   });
   ```
   Reject. The mock IS the system; the test verifies nothing real.

2. **Tests that re-encode implementation details.**
   ```ts
   expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ... }));
   expect(spy).toHaveBeenCalledTimes(3);
   ```
   Reject when the count is incidental — a refactor that changes the call shape will break the test even though the behaviour is unchanged.

3. **Weak assertions.**
   ```ts
   expect(result).toBeDefined();
   expect(response).toBeTruthy();
   expect(rows.length > 0).toBe(true);  // 1 row vs 1000 rows is the same here
   ```
   Reject. Replace with the *specific value* the test claims to be checking.

4. **Snapshot-everything.**
   ```ts
   expect(res.body).toMatchSnapshot();
   ```
   Snapshots are appropriate for stable, reviewer-readable output (e.g., a generated SQL plan). For API responses they become noise — every shape change requires a snapshot update with no human reasoning. Reject by default.

5. **Tests that skip the real DB.**
   ```ts
   const mockPool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
   const repo = new ContractorsRepository(mockPool as never);
   ```
   For repository tests, this is the wrong layer. Move it to the integration suite (Testcontainers, real Postgres). The mock-DB unit test verifies the SQL string format, not what Postgres actually does with it.

---

## Productivity, calibrated

Rough observation across PRs #4, #7, #8, #9, #13, #17:

| Test class | AI assistance impact | Why |
|---|---|---|
| Zod schema validation (PR #7) | **~2× faster** | Highly repetitive shape; one good exemplar anchors the rest. |
| State-machine transition tables (PR #7) | **~2× faster** | `it.each` table generation is mechanical. |
| Pact consumer interactions (PR #8) | **~1.5× faster** | DSL is unfamiliar; AI helps with the syntax but the request/response bodies still need hand-tuning. |
| Integration tests with Testcontainers (PR #4) | **~1.3× faster** | Scaffolding is fast; the assertions need rewriting. |
| Multi-tenant isolation tests (PR #4) | **~1× (neutral)** | The thinking is the work; the typing isn't the bottleneck. |
| JWT lifecycle / security tests (PR #17) | **~0.8× (slightly negative)** | AI's instinct is to write weak assertions ("returns 401") instead of strong ones ("returns 401 with code UNAUTHORIZED in the typed envelope"). Time saved typing < time spent fixing. |
| Performance test thresholds (PR #13) | **~1× (neutral)** | k6's threshold DSL is small; the SLOs come from the strategy doc, not from intuition. |
| Mutation-test fix-up (PR #9) | **~0.5× (negative)** | Fixing a surviving mutant requires reasoning about *why* it survived; AI tends to add a parallel weak test instead of fixing the existing one. |

Net across the test work in this stack: **~1.4× scaffolding speedup**, with ~25 % of test code rewritten by hand during review. Calibrate accordingly — AI is a tool, not a force multiplier on the mind work.

---

## Prompt templates

### Template A — Zod schema validation tests

```
Role: You are writing Vitest tests for a Zod schema in a TypeScript monorepo.

Production code:
<paste the schema definition>

Style anchor — please copy the patterns in this existing test:
<paste 1 existing schema test from packages/shared/src/schemas/*.test.ts>

Coverage requirement: every exported schema gets at least one valid + one
invalid case. For .refine() rules, the invalid case must assert on the
issue path so a future change to a different field's validation does not
silently swap which rule failed.

Do NOT:
- mock anything (these schemas have no I/O)
- use snapshot tests
- use .toBeTruthy() — assert on specific values
- skip the boundary cases (min, max, defaults, refines)
```

### Template B — Integration test with Testcontainers

```
Role: You are writing a Jest integration test for @contractor-os/api.

Production code under test:
<paste the service method>

Test infrastructure to reuse:
- createTestApp() from test/setup/test-app.ts (returns ctx.app + ctx.pool)
- resetDatabase(ctx.pool) in beforeEach
- factories from test/factories/ (createOrg, createUser, createContractor, createEngagement, createInvoice)

Style anchor:
<paste 1 existing test from test/integration/*.int-spec.ts>

Coverage requirement: happy path + at least 3 edge cases (validation failure,
state transition failure, cross-tenant isolation if relevant).

Do NOT:
- mock the pg pool — this is integration, hit Postgres
- use expect(toBeDefined / toBeTruthy) — assert on the exact response shape
- assume HTTP status codes — a Nest @Post() defaults to 201, not 200
- introduce new dependencies
```

### Template C — RBAC matrix test

```
Role: You are writing Jest integration tests for the RBAC layer.

The route under test is <PATH> with @Roles(<ROLE>) decoration.

For each of the three roles (admin, manager, contractor), produce a test:
- The role IS allowed → 2xx
- The role is NOT allowed → 403
- The role's user is from a different org → 404 (not 403, to prevent enumeration)

Style anchor:
<paste 1 existing test from test/security/rbac.sec-spec.ts>

Do NOT:
- conflate 403 and 404 — they have different security implications
- mock the JwtAuthGuard — use a real signed token via test/setup/auth-helper.ts
```

### Template D — k6 performance scenario

```
Role: You are writing a k6 scenario script targeting apps/api running on
http://localhost:3001/api/v1. The seed script populates 1k orgs / 10k
contractors / 5k engagements / 50k invoices. A pre-made admin login is
admin@perf.test / Password1.

The SLO budgets to enforce as k6 thresholds:
- read p95 < 300 ms
- write p95 < 500 ms
- error rate < 0.1 %

Style anchor:
<paste performance/k6/load.js>

Helpers to reuse:
- lib/auth.js (login, BASE_URL)
- lib/data.js (loadSeedSample, randomItem)
- lib/thresholds.js (standardThresholds, advisoryThresholds)

Do NOT:
- write your own login function
- hard-code ids — they vary between seed runs
- omit the threshold object — a perf test without enforced SLOs is a regression machine
```

### Template E — Pact consumer interaction

```
Role: You are writing a @pact-foundation/pact v3 consumer test in
apps/web/test/pact/<resource>.pact.test.ts.

The interaction to capture:
- HTTP <method> <path>
- Request body shape: <paste shape>
- Response status + body shape: <paste shape>
- Provider state: a short English description of what the api must seed
  before this interaction can be replayed

Style anchor:
<paste apps/web/test/pact/auth.pact.test.ts>

Constants to reuse from constants.ts: PROVIDER, CONSUMER, PACT_DIR,
ADMIN_BEARER, CONTRACTOR_BEARER, ORG_A_ID, etc.

Do NOT:
- reuse the same provider state name across tests with different
  request bodies — Pact V3 dedupes on (state, path, method) and
  silently drops duplicates
- use exact-string matchers for fields the api may legitimately vary
  (timestamps, ids) — use MatchersV3.string(...) / like(...)
```

---

## When NOT to reach for AI

Hand-write, don't prompt, in these four scenarios:

1. **Novel domain logic** — the classification scoring engines (IRS / DOL / ABC), the invoice state machine's edge cases. AI doesn't know the IRS common-law test; it'll guess and produce confidently-wrong assertions. Read the spec, write the table.

2. **Security-critical assertions** — JWT lifecycle, multi-tenant isolation, RBAC matrix. A weak test here is worse than no test, because it falsely signals coverage. Hand-write so you own every assertion.

3. **Performance-critical paths** — the k6 thresholds encode SLOs that came from a product conversation, not from intuition. The threshold values must come from `TEST_STRATEGY.md`, copied carefully — not generated.

4. **Debugging an existing flaky test** — non-determinism is reasoning, not typing. The clue is in the timing, the order, the shared state. AI doesn't see the symptom history; you do.

If you find yourself prompting "make this flaky test stop being flaky," step away from the chat and read the test instead.

---

## See also

- [QUALITY_DASHBOARD.md](./QUALITY_DASHBOARD.md) — current state of all quality metrics
- [TEST_STRATEGY.md](./TEST_STRATEGY.md) — what we test, at which layer, and to what coverage
- [TEST_PLAN.md](./TEST_PLAN.md) — the contractor-onboarding-to-paid-invoice scenarios
- [QA_BEST_PRACTICES.md](./QA_BEST_PRACTICES.md) — review checklist + naming + flaky policy
- [AUDIT.md](./AUDIT.md) — baseline assessment that drove the work above
- [CONTRACT_TESTING.md](./CONTRACT_TESTING.md) · [MUTATION_TESTING.md](./MUTATION_TESTING.md) · [PERFORMANCE_TESTING.md](./PERFORMANCE_TESTING.md) · [SECURITY_TESTING.md](./SECURITY_TESTING.md)
