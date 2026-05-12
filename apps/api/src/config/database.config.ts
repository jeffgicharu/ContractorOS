import type { PoolConfig } from 'pg';

export interface DatabaseConfig {
  connectionString: string;
  pool: PoolConfig;
}

const DEFAULT_POOL_MAX = 40;
const DEFAULT_POOL_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_POOL_CONNECTION_TIMEOUT_MS = 5_000;

function parsePositiveInt(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid ${name}: ${raw} (must be a positive integer)`);
  }
  return n;
}

export function loadDatabaseConfig(): DatabaseConfig {
  const connectionString = process.env['DATABASE_URL'];

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    connectionString,
    pool: {
      connectionString,
      max: parsePositiveInt('PG_POOL_MAX', process.env['PG_POOL_MAX'], DEFAULT_POOL_MAX),
      idleTimeoutMillis: parsePositiveInt(
        'PG_POOL_IDLE_TIMEOUT_MS',
        process.env['PG_POOL_IDLE_TIMEOUT_MS'],
        DEFAULT_POOL_IDLE_TIMEOUT_MS,
      ),
      connectionTimeoutMillis: parsePositiveInt(
        'PG_POOL_CONNECTION_TIMEOUT_MS',
        process.env['PG_POOL_CONNECTION_TIMEOUT_MS'],
        DEFAULT_POOL_CONNECTION_TIMEOUT_MS,
      ),
    },
  };
}
