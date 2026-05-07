// @ts-check

/**
 * Stryker mutation testing config for @contractor-os/web.
 *
 * SCOPE
 * Mutations are run only against the source files that today's vitest
 * suite actually exercises (login page, engagement form, two UI
 * primitives, format helpers). Broader scope is deferred until the
 * component suite expands. The strategy doc targets ≥70% mutation
 * score; the thresholds below are interim ratchet values.
 *
 * RUNNER
 * Vitest is invoked via @stryker-mutator/vitest-runner. The runner
 * picks up vitest.config.ts.
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: {
    configFile: 'vitest.config.ts',
  },
  reporters: ['clear-text', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/web/index.html' },
  jsonReporter: { fileName: 'reports/mutation/web/mutation.json' },
  mutate: [
    'src/components/ui/button.tsx',
    'src/components/ui/input.tsx',
    'src/components/engagements/engagement-form.tsx',
    'src/lib/format.ts',
    'src/app/(auth)/login/page.tsx',
  ],
  coverageAnalysis: 'perTest',
  concurrency: 2,
  timeoutMS: 30_000,
  cleanTempDir: true,
  // Interim ratchet — measured baseline is 13.97% overall mutation score
  // (40.43% on the bits actually exercised; 89 of 136 mutants are
  // currently "no coverage" because the login page and engagement form
  // mutants are not reached by the vitest runner under stryker — root
  // cause investigation is tracked separately in MUTATION_TESTING.md).
  // The threshold is set against the overall score so future PRs that
  // close the no-coverage gap drive the score up.
  thresholds: {
    high: 19, // grow into this
    low: 11, // floor(actual - 2)
    break: 11, // CI fails below this
  },
};
