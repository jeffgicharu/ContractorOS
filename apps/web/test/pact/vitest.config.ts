import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Pact consumer config for @contractor-os/web.
 *
 * Runs only `apps/web/test/pact/**.pact.test.ts` and writes the resulting
 * pact JSON files to the repo-root `./pacts/` directory.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['test/pact/**/*.pact.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@contractor-os/shared': path.resolve(__dirname, '../../../../packages/shared/src'),
    },
  },
});
