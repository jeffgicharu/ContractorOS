import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { AppModule } from '../../src/app.module';
import { DATABASE_POOL } from '../../src/database/database.module';

const STATE_FILE = path.resolve(__dirname, '.container-state.json');

interface ContainerState {
  databaseUrl: string;
  jwtSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
}

function loadState(): ContainerState {
  if (process.env.DATABASE_URL && process.env.JWT_SECRET) {
    return {
      databaseUrl: process.env.DATABASE_URL,
      jwtSecret: process.env.JWT_SECRET,
      jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
      jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    };
  }
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(
      'Integration container state not found. Did global-setup run? Looked at: ' + STATE_FILE,
    );
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as ContainerState;
}

export interface TestAppContext {
  app: INestApplication;
  pool: Pool;
  databaseUrl: string;
  close: () => Promise<void>;
}

export async function createTestApp(
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<TestAppContext> {
  const state = loadState();
  process.env.DATABASE_URL = state.databaseUrl;
  process.env.JWT_SECRET = state.jwtSecret;
  process.env.JWT_ACCESS_EXPIRY = state.jwtAccessExpiry;
  process.env.JWT_REFRESH_EXPIRY = state.jwtRefreshExpiry;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  // Disable per-IP rate limiting in integration tests — the suite fires
  // hundreds of requests in tight loops against a single source address
  // and would trip the production-default 60 req/min ceiling. Tests
  // that need the limiter active (e.g. rate-limit.int-spec.ts) set
  // THROTTLE_LIMIT to a small value in beforeAll BEFORE calling this
  // fixture; the conditional preserves their override.
  if (process.env.THROTTLE_LIMIT === undefined) {
    process.env.THROTTLE_LIMIT = '0';
  }

  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (customize) builder = customize(builder);
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  app.disable('x-powered-by');
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  await app.init();

  const pool = app.get<Pool>(DATABASE_POOL);

  return {
    app,
    pool,
    databaseUrl: state.databaseUrl,
    close: async () => {
      await app.close();
    },
  };
}
