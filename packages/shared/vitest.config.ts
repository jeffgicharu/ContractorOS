import { defineConfig } from 'vitest/config';

/**
 * Vitest config for @contractor-os/shared.
 *
 * `coverageThreshold` reflects floor(actual − 2%) of the suite's measured
 * coverage today. It acts as a regression ratchet so coverage cannot
 * silently slide below the level we have when these tests land. The
 * eventual target — 90% statements per package per TEST_STRATEGY.md — will
 * be approached incrementally as we extend coverage to the schemas, types,
 * and constants that are not yet exercised here.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/index.ts',
        'src/types/**',
      ],
      thresholds: {
        statements: 98,
        branches: 98,
        functions: 98,
        lines: 98,
      },
    },
  },
});
