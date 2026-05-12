// @ts-check

/**
 * Stryker mutation testing config for @contractor-os/api.
 *
 * SCOPE
 * Mutations are run only against src/modules/**\/*.service.ts. The wider
 * service tree (controllers, repositories, scoring engines) will be added
 * as those layers gain test coverage. The strategy doc TEST_STRATEGY.md
 * targets ≥70% mutation score on the api service layer; the thresholds
 * below are interim ratchet values measured at the time the suite first
 * ran, not the eventual goal.
 *
 * RUNNER
 * Jest is configured to discover the existing *.spec.ts unit suite under
 * src/. Stryker runs each surviving mutant through this suite and asks
 * whether at least one test fails — if every test still passes, the
 * mutation "survived" and indicates a weak assertion.
 *
 * REPORT FILES
 * - reports/mutation/api/index.html — interactive UI
 * - reports/mutation/api/mutation.json — machine-readable score
 * - reports/mutation/api/junit.xml — CI consumption
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'pnpm',
  testRunner: 'jest',
  plugins: ['@stryker-mutator/jest-runner'],
  // Mutate files in place so jest's `<rootDir>/../../../packages/shared/src`
  // moduleNameMapper still resolves correctly. The default sandbox copy
  // breaks workspace-relative paths because packages/shared is not under
  // apps/api. Stryker restores files on exit; on a hard crash, run
  // `git restore apps/api/src` to undo any mutations left behind.
  inPlace: true,
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.ts',
    enableFindRelatedTests: true,
  },
  reporters: ['clear-text', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/api/index.html' },
  jsonReporter: { fileName: 'reports/mutation/api/mutation.json' },
  // dashboardReporter: { project: 'github.com/jeffgicharu/ContractorOS' },
  // ^ Hosted Stryker Dashboard (the PactFlow-equivalent for mutation
  //   scores) is left for a future PR once we adopt a hosted broker.
  mutate: [
    'src/modules/**/*.service.ts',
    '!src/modules/**/*.spec.ts',
    '!src/**/*.module.ts',
  ],
  coverageAnalysis: 'perTest',
  concurrency: 2, // half of 4 cores
  timeoutMS: 30_000,
  cleanTempDir: true,
  // Interim ratchet — measured baseline is 57.78% mutation score across
  // 1279 mutants (739 killed / 390 survived / 150 no-coverage). The
  // strategy doc TEST_STRATEGY.md targets ≥70% on the api service layer;
  // we close the gap by killing surviving mutants listed in
  // MUTATION_TESTING.md, then re-tightening these numbers.
  thresholds: {
    high: 63, // grow into this
    low: 55, // floor(actual - 2)
    break: 55, // CI fails below this
  },
};
