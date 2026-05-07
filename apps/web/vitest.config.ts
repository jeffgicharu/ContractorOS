import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

/**
 * Vitest config for @contractor-os/web.
 *
 * `coverageThreshold` is interim and reflects floor(actual − 2%) of the
 * suite's coverage today. It acts as a regression ratchet — coverage of the
 * stateful surfaces we DO test (forms, primitives, lib) cannot slide below
 * today's level.
 *
 * The eventual target — 70% statements per the strategy in
 * TEST_STRATEGY.md — applies to the broader stateful component layer and
 * will be approached as more components are added to the suite. Today's
 * scope is intentionally narrower (forms with Zod validation, UI
 * primitives, format helpers, custom hooks).
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'cypress'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      // Coverage scope intentionally narrow: only the files directly
      // exercised by the suite today (forms with Zod validation, the two UI
      // primitives, format helpers, and the login page). Every additional
      // component added to this list must come with a test in the same PR.
      include: [
        'src/components/ui/button.tsx',
        'src/components/ui/input.tsx',
        'src/components/engagements/engagement-form.tsx',
        'src/lib/format.ts',
        'src/app/**/login/page.tsx',
      ],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
      ],
      // Set to floor(measured - 2) of the suite's actual coverage. The
      // strategy's 70% target in TEST_STRATEGY.md applies to the broader
      // stateful component layer; expanding the include list will surface
      // the gap and require new tests in the same PR.
      thresholds: {
        statements: 96,
        branches: 89,
        functions: 98,
        lines: 96,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Bypass the built dist/ output of @contractor-os/shared and resolve
      // imports straight to the package's TypeScript source. This mirrors the
      // moduleNameMapper used in apps/api/jest.config.ts and means the web
      // suite does not depend on a successful build of the shared package
      // (which is the order CI runs jobs in).
      '@contractor-os/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
