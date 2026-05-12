# Contract Testing — ContractorOS

This repo uses [Pact](https://docs.pact.io/) consumer-driven contract tests between `@contractor-os/web` (the consumer) and `@contractor-os/api` (the provider). The two apps share `@contractor-os/shared` Zod schemas for type-level parity, but Pact gives a **runtime guarantee** that the api still serves what the web client actually sends and expects, even when the two are deployed independently.

---

## What Pact gives us that integration and E2E tests do not

- **Integration tests** (`apps/api/test/**`) exercise the api against a real Postgres but don't speak for what the web client actually sends — they assume the test fixtures match what the consumer will produce.
- **E2E tests** (`apps/web/cypress/**`) cover full user journeys but are slow, run against a live stack, and only catch a divergence that happens to be reachable through the UI under test.
- **Contract tests** sit between the two:
  - The consumer tests run in `apps/web` against a Pact mock provider, capturing exactly which routes the web client calls, with what request shape, and the response shape it expects. These are recorded as JSON in `./pacts/`.
  - The provider tests run in `apps/api` against the recorded pacts. Each interaction is replayed against the real api (with a Testcontainers Postgres), and the api's actual response is compared to what the consumer expected.
  - A breaking change on the api side fails the provider verification immediately, before either app deploys, even if no E2E or integration test happens to cover the changed path. Conversely, a frontend change that calls a route the api doesn't serve (or with a wrong shape) fails the consumer test.

---

## Where pact files live

`./pacts/` at the monorepo root. Files are named `<consumer>-<provider>.json`:

```
pacts/
  contractor-os-web-contractor-os-api.json
```

The directory is committed to git so the contract is versioned. Reviewers can diff `./pacts/*.json` on a PR to see exactly which interactions changed. This is sufficient for a single consumer / single provider topology. **When we add a second consumer (mobile, BI, public SDK)** we will swap in a hosted [Pact Broker](https://github.com/pact-foundation/pact_broker) (PactFlow is the SaaS option) so multi-consumer compatibility can be enforced without manual file management. That migration is a clean swap — the consumer and provider tests do not change shape, only the publish/fetch URL.

---

## How to run

### Consumer (writes pact files to `./pacts/`)

```bash
pnpm --filter @contractor-os/web test:pact
```

This runs the consumer Vitest suite. Each interaction is registered with the Pact mock server, the web app's HTTP client invokes it, the response is asserted, and a pact JSON file is written.

### Provider verification (reads `./pacts/`, replays against the api)

```bash
pnpm --filter @contractor-os/api test:pact:verify
```

This:

1. Spins up an ephemeral `postgres:16-alpine` via Testcontainers.
2. Runs the api's normal `node-pg-migrate` migrations.
3. Bootstraps a real NestJS app on a random port.
4. For every interaction in `./pacts/`, runs the matching state handler (which seeds the DB so the interaction is reproducible), then replays the request and asserts the response matches.
5. Tears down.

### End-to-end (consumer then provider)

```bash
pnpm test:contracts
```

Runs the consumer suite to (re)generate pacts, then runs provider verification against them. CI runs this exact command.

---

## Consumer / provider state handlers

Each consumer interaction declares one or more **provider states** — short English descriptions of the world the api must be in for the interaction to make sense:

```ts
.given('an admin user admin@org.test exists with password Password1')
.uponReceiving('a login request with valid credentials')
```

The provider verifier maps each state name to a state handler in `apps/api/test/pact/state-handlers.ts`. The handler is given the Postgres pool and seeds whatever rows are needed:

```ts
'an admin user admin@org.test exists with password Password1': async ({ pool }) => {
  const org = await createOrg(pool);
  await createAdmin(pool, org.id, 'admin@org.test', 'Password1');
}
```

A state handler must be **idempotent** within a single verifier run — the verifier calls `setup` before each interaction and `teardown` after.

---

## Trade-offs

| Aspect | Today (file-system pacts) | Future (hosted broker) |
|---|---|---|
| **Storage** | `./pacts/*.json` in git | Pact Broker / PactFlow |
| **Multi-consumer support** | Single consumer only | Multiple consumers, with `can-i-deploy` checks |
| **Compat across versions** | One contract = current | Versioned contracts + matrix |
| **Webhook on contract change** | Manual (PR diff) | Automated (Slack, CI, etc.) |
| **Cost** | Zero | Self-hosted or PactFlow paid tier |
| **Adoption cost** | None — already configured | Add `pact-broker` URL + token |

The file-system approach is the right call until ContractorOS gets a second consumer. The day a mobile app or third-party SDK starts calling `/api/v1/*`, we will adopt a hosted broker and keep everything else the same.

---

## Adding a new consumer interaction

1. Add a test in `apps/web/test/pact/<name>.pact.test.ts`.
2. Run `pnpm --filter @contractor-os/web test:pact`. The consumer suite passes locally and a new pact file is generated under `./pacts/`.
3. Add the corresponding state handler in `apps/api/test/pact/state-handlers.ts` if your interaction needs DB state that isn't already seeded.
4. Run `pnpm --filter @contractor-os/api test:pact:verify`. Provider verification passes.
5. Commit the updated pact file along with your test code so the contract change is traceable.

CI runs the full chain on every PR. A breaking change to the api fails provider verification; a breaking change to the web client's request shape fails the consumer test.

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
