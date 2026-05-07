import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (customize) builder = customize(builder);
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ logger: false });
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
