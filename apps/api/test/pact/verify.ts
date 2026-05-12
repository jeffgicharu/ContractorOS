import 'reflect-metadata';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { NestFactory } from '@nestjs/core';
import { type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { AppModule } from '../../src/app.module';
import { DATABASE_POOL } from '../../src/database/database.module';
import { buildStateHandlers } from './state-handlers';
import {
  ADMIN_BEARER,
  CONTRACTOR_BEARER,
  ADMIN_USER_ID,
  CONTRACTOR_USER_ID,
  ORG_A_ID,
} from './constants';

const PACT_FILE = path.resolve(__dirname, '../../../../pacts/contractor-os-web-contractor-os-api.json');

interface PactState {
  name: string;
}

interface PactRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface PactResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

interface Interaction {
  description: string;
  providerStates: PactState[];
  request: PactRequest;
  response: PactResponse;
}

interface PactFile {
  consumer: { name: string };
  provider: { name: string };
  interactions: Interaction[];
}

async function applyMigrations(databaseUrl: string): Promise<void> {
  const apiRoot = path.resolve(__dirname, '../..');
  const migrateBin = path.join(apiRoot, 'node_modules', 'node-pg-migrate', 'bin', 'node-pg-migrate.js');
  execFileSync(
    process.execPath,
    ['--import', 'tsx', migrateBin, 'up', '--migrations-dir', 'src/database/migrations'],
    {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: ['ignore', 'ignore', 'inherit'],
    },
  );
}

async function bootstrapApp(): Promise<{ app: INestApplication; port: number }> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  await app.init();
  await app.listen(0);
  const server = app.getHttpServer() as { address: () => { port: number } };
  return { app, port: server.address().port };
}

function buildJwt(role: 'admin' | 'contractor'): string {
  const payload =
    role === 'admin'
      ? { sub: ADMIN_USER_ID, orgId: ORG_A_ID, role: 'admin' }
      : { sub: CONTRACTOR_USER_ID, orgId: ORG_A_ID, role: 'contractor' };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

function buildHeaders(reqHeaders: Record<string, string> | undefined): Record<string, string> {
  const headers: Record<string, string> = { ...reqHeaders };
  const auth = headers['Authorization'] ?? headers['authorization'];
  if (auth) {
    if (auth.includes(ADMIN_BEARER)) {
      headers['Authorization'] = `Bearer ${buildJwt('admin')}`;
    } else if (auth.includes(CONTRACTOR_BEARER)) {
      headers['Authorization'] = `Bearer ${buildJwt('contractor')}`;
    }
    delete headers['authorization'];
  }
  return headers;
}

/**
 * Pact-style permissive deep match. Treats expected as a "type example":
 * - primitive types must match (string/number/boolean)
 * - objects: every expected key must exist in actual with a matching shape
 * - arrays: every expected element matches the actual element at the same index
 * - actual may have extra keys not present in expected (provider may emit more)
 */
function deepMatch(expected: unknown, actual: unknown, path = '$'): string[] {
  const errors: string[] = [];
  if (expected === null || expected === undefined) {
    return errors;
  }
  if (typeof expected !== typeof actual) {
    errors.push(`${path}: expected type ${typeof expected}, got ${typeof actual}`);
    return errors;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      errors.push(`${path}: expected array, got ${typeof actual}`);
      return errors;
    }
    expected.forEach((item, i) => {
      if (i < actual.length) {
        errors.push(...deepMatch(item, actual[i], `${path}[${i}]`));
      } else {
        errors.push(`${path}[${i}]: missing in actual`);
      }
    });
    return errors;
  }
  if (typeof expected === 'object') {
    const ex = expected as Record<string, unknown>;
    const ac = actual as Record<string, unknown>;
    for (const key of Object.keys(ex)) {
      if (!(key in ac)) {
        errors.push(`${path}.${key}: missing in actual response`);
        continue;
      }
      errors.push(...deepMatch(ex[key], ac[key], `${path}.${key}`));
    }
    return errors;
  }
  // primitives — types match, values may differ (Pact "like" matcher)
  return errors;
}

async function verifyInteraction(
  interaction: Interaction,
  baseUrl: string,
  stateHandlers: Record<string, () => Promise<void>>,
): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const state of interaction.providerStates ?? []) {
    const handler = stateHandlers[state.name];
    if (!handler) {
      errors.push(`No state handler registered for: "${state.name}"`);
      return { ok: false, errors };
    }
    try {
      await handler();
    } catch (err) {
      errors.push(`State handler "${state.name}" threw: ${(err as Error).message}`);
      return { ok: false, errors };
    }
  }

  const headers = buildHeaders(interaction.request.headers);
  const url = `${baseUrl}${interaction.request.path}`;
  const init: RequestInit = {
    method: interaction.request.method,
    headers,
  };
  if (interaction.request.body !== undefined && interaction.request.method !== 'GET') {
    init.body = typeof interaction.request.body === 'string'
      ? interaction.request.body
      : JSON.stringify(interaction.request.body);
  }

  const res = await fetch(url, init);
  if (res.status !== interaction.response.status) {
    errors.push(`Status: expected ${interaction.response.status}, got ${res.status}`);
  }

  const text = await res.text();
  let actualBody: unknown = undefined;
  if (text.length > 0) {
    try {
      actualBody = JSON.parse(text);
    } catch {
      actualBody = text;
    }
  }

  if (interaction.response.body !== undefined) {
    errors.push(...deepMatch(interaction.response.body, actualBody));
  }

  return { ok: errors.length === 0, errors };
}

async function main(): Promise<void> {
  let container: StartedPostgreSqlContainer | undefined;
  let app: INestApplication | undefined;

  try {
    console.log('Starting Postgres via Testcontainers…');
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('contractor_os_pact')
      .withUsername('contractor_os')
      .withPassword('contractor_os')
      .start();

    const databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET = 'pact-verification-jwt-secret';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';
    process.env.NODE_ENV = 'test';
    process.env.PORT = '0';
    process.env.CORS_ORIGIN = 'http://localhost:3000';

    console.log('Applying migrations…');
    await applyMigrations(databaseUrl);

    console.log('Bootstrapping NestJS app…');
    const bootstrap = await bootstrapApp();
    app = bootstrap.app;
    const baseUrl = `http://127.0.0.1:${bootstrap.port}`;
    console.log(`Provider listening at ${baseUrl}`);

    const pool = app.get<Pool>(DATABASE_POOL);
    const stateHandlers = buildStateHandlers(pool);

    const pactRaw = fs.readFileSync(PACT_FILE, 'utf8');
    const pact = JSON.parse(pactRaw) as PactFile;
    console.log(
      `\nVerifying ${pact.interactions.length} interactions from ${pact.consumer.name} → ${pact.provider.name}\n`,
    );

    let passed = 0;
    let failed = 0;
    for (const interaction of pact.interactions) {
      const result = await verifyInteraction(interaction, baseUrl, stateHandlers);
      if (result.ok) {
        passed += 1;
        console.log(`  ✓ ${interaction.description}`);
      } else {
        failed += 1;
        console.log(`  ✗ ${interaction.description}`);
        for (const err of result.errors) {
          console.log(`      ${err}`);
        }
      }
    }

    console.log(`\nResult: ${passed} passed, ${failed} failed (of ${pact.interactions.length})`);
    if (failed > 0) {
      process.exitCode = 1;
    } else {
      console.log('\n✓ All consumer interactions verified against the provider');
    }
  } catch (err) {
    console.error('Provider verification crashed:', err);
    process.exitCode = 2;
  } finally {
    if (app) await app.close();
    if (container) await container.stop();
  }
}

main();
