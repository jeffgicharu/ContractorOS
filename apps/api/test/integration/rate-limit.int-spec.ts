import request from 'supertest';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

// Build a fresh app *with* the rate limiter enabled (limit=3 / 60 s) and
// assert that the 4th request from the same IP returns 429. This bypasses
// the shared test-app fixture because that fixture deliberately disables
// the limiter for the rest of the integration suite.

describe('Integration: Rate limiter (per-IP 429)', () => {
  beforeAll(() => {
    process.env.THROTTLE_LIMIT = '3';
    process.env.THROTTLE_TTL = '60';
  });

  afterAll(() => {
    process.env.THROTTLE_LIMIT = '0';
  });

  it('returns 429 after the configured limit is exceeded by a single IP', async () => {
    // Force a fresh evaluation of AppModule so the throttler constants
    // (which read from process.env at module-import time) pick up the
    // values set in beforeAll above instead of any cached version.
    jest.resetModules();
    const { AppModule } = await import('../../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.disable('x-powered-by');
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();

    try {
      // Three allowed.
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      }
      // Fourth must be rate-limited.
      const blocked = await request(app.getHttpServer()).get('/api/v1/health');
      expect(blocked.status).toBe(429);
    } finally {
      await app.close();
    }
  });
});
