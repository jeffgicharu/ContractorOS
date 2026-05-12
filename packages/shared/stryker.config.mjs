// @ts-check

/**
 * Stryker mutation testing config for @contractor-os/shared.
 *
 * SCOPE
 * The shared package is pure logic (Zod schemas, state-machine
 * transition validators, constants). Coverage on the test suite is
 * already at 100%, so mutation testing is the right next signal: it
 * tells us whether the assertions actually constrain behaviour.
 *
 * RUNNER
 * Vitest is invoked via @stryker-mutator/vitest-runner.
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
  htmlReporter: { fileName: 'reports/mutation/shared/index.html' },
  jsonReporter: { fileName: 'reports/mutation/shared/mutation.json' },
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/types/**',
  ],
  coverageAnalysis: 'perTest',
  concurrency: 2,
  timeoutMS: 15_000,
  cleanTempDir: true,
  // Interim ratchet — measured baseline is 55.70% mutation score across
  // 316 mutants (176 killed / 140 survived / 0 no-coverage). The strategy
  // doc TEST_STRATEGY.md targets ≥70% on the api service layer; we
  // approach that by adding tests that kill specific surviving mutants
  // listed in MUTATION_TESTING.md, then re-tightening these numbers.
  thresholds: {
    high: 60, // grow into this
    low: 53, // floor(actual - 2)
    break: 53, // CI fails below this
  },
};
