import type { Config } from 'jest';
import path from 'node:path';

// Security test suite. Shares the same Testcontainers Postgres + NestJS
// bootstrap as the integration suite (test/setup/global-setup.ts) so a
// single CI run picks up both gates without paying the container startup
// cost twice.

const config: Config = {
  rootDir: path.resolve(__dirname, '..', '..'),
  testRegex: 'test/security/.*\\.sec-spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@contractor-os/shared$': '<rootDir>/../../packages/shared/src',
  },
  globalSetup: '<rootDir>/test/setup/global-setup.ts',
  globalTeardown: '<rootDir>/test/setup/global-teardown.ts',
  testTimeout: 30_000,
  maxWorkers: 1,
};

export default config;
