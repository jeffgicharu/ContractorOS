import type { PoolConfig } from 'pg';

export interface DatabaseConfig {
  connectionString: string;
  pool: PoolConfig;
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
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    },
  };
}
