import type { Config } from 'jest';

/**
 * Unit-test Jest config for @contractor-os/api.
 *
 * The `coverageThreshold` below is interim and reflects floor(actual - 2%) of
 * the combined unit + integration coverage that the api currently achieves
 * when both suites run together (statements 72.23, branches 64.85, functions
 * 59.73, lines 71.4 as of the time these thresholds were set). It acts as a
 * regression ratchet so coverage cannot silently slide below today's level.
 *
 * The eventual targets — statements 80, branches 75, functions 70, lines 80
 * for the api — are documented in TEST_STRATEGY.md and will be raised
 * incrementally by future test work.
 *
 * Because the combined-coverage number is a function of running BOTH the
 * unit suite (`pnpm test`) and the integration suite (`pnpm test:integration`)
 * together, the canonical command that exercises this threshold is
 * `pnpm test:all:cov`, which runs both via `jest --projects` and reports
 * merged coverage. CI uses that command as its quality gate.
 *
 * Running `pnpm test -- --coverage` against unit alone WILL fail this
 * threshold because integration tests cover ~13% additional statements;
 * that is expected — use `pnpm test:all:cov` for the canonical check.
 */
const config: Config = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testRegex: 'src/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@contractor-os/shared$': '<rootDir>/../../packages/shared/src',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/database/migrations/**',
    '!src/database/seeds/**',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 62,
      functions: 57,
      lines: 69,
    },
  },
};

export default config;
