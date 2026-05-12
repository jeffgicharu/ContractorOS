import request from 'supertest';
import { createTestApp, type TestAppContext } from '../setup/test-app';

// Forces a fresh app with the rate limiter active (limit=3 / 60 s) and
// asserts the 4th request from the same IP returns 429. The shared
// test-app fixture defaults to THROTTLE_LIMIT=0; the override here
// re-enables it before the app is created so ThrottlerModule.forRootAsync
// picks up the small ceiling at module-instantiation time.

describe('Integration: Rate limiter (per-IP 429)', () => {
  let ctx: TestAppContext;
  let prevLimit: string | undefined;
  let prevTtl: string | undefined;

  beforeAll(async () => {
    prevLimit = process.env.THROTTLE_LIMIT;
    prevTtl = process.env.THROTTLE_TTL;
    process.env.THROTTLE_LIMIT = '3';
    process.env.THROTTLE_TTL = '60';
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
    if (prevLimit === undefined) delete process.env.THROTTLE_LIMIT;
    else process.env.THROTTLE_LIMIT = prevLimit;
    if (prevTtl === undefined) delete process.env.THROTTLE_TTL;
    else process.env.THROTTLE_TTL = prevTtl;
  });

  it('returns 429 after the configured limit is exceeded by a single IP', async () => {
    // Three allowed.
    for (let i = 0; i < 3; i++) {
      await request(ctx.app.getHttpServer()).get('/api/v1/health').expect(200);
    }
    // Fourth must be rate-limited.
    const blocked = await request(ctx.app.getHttpServer()).get('/api/v1/health');
    expect(blocked.status).toBe(429);
  });
});
