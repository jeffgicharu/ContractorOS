import type { Config } from 'jest';
import path from 'node:path';

const config: Config = {
  rootDir: path.resolve(__dirname, '..'),
  testRegex: 'test/integration/.*\\.int-spec\\.ts$',
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
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/database/migrations/**',
    '!src/database/seeds/**',
    '!src/main.ts',
  ],
  coverageDirectory: '<rootDir>/coverage-integration',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/coverage-integration',
        outputName: 'junit.xml',
        ancestorSeparator: ' > ',
      },
    ],
  ],
};

export default config;
