import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

declare global {
  // eslint-disable-next-line no-var
  var __PG_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

const STATE_FILE = path.resolve(__dirname, '.container-state.json');

export default async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('contractor_os_int')
    .withUsername('contractor_os')
    .withPassword('contractor_os')
    .start();

  const databaseUrl = container.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = 'integration-test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  process.env.CORS_ORIGIN = 'http://localhost:3000';

  const apiRoot = path.resolve(__dirname, '..', '..');
  const migrateBin = path.join(apiRoot, 'node_modules', 'node-pg-migrate', 'bin', 'node-pg-migrate.js');

  execFileSync(
    process.execPath,
    [
      '--import',
      'tsx',
      migrateBin,
      'up',
      '--migrations-dir',
      'src/database/migrations',
    ],
    {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    },
  );

  globalThis.__PG_CONTAINER__ = container;

  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({
      databaseUrl,
      jwtSecret: process.env.JWT_SECRET,
      jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY,
      jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY,
      containerId: container.getId(),
    }),
    'utf8',
  );
}
