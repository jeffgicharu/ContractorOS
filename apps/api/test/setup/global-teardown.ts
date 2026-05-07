import path from 'node:path';
import fs from 'node:fs';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

declare global {
  // eslint-disable-next-line no-var
  var __PG_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

const STATE_FILE = path.resolve(__dirname, '.container-state.json');

export default async function globalTeardown() {
  const container = globalThis.__PG_CONTAINER__;
  if (container) {
    await container.stop();
  }
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}
