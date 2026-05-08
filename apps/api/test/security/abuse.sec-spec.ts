import request from 'supertest';
import { UserRole } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser } from '../factories';

describe('Security: Abuse and rate limiting', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.pool);
  });

  it('100 rapid invalid-credentials login attempts return 401, never 5xx', async () => {
    const org = await createOrg(ctx.pool);
    await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'rate-limit@org.test',
      password: 'Password1',
    });

    // 100 attempts run sequentially against the in-process supertest
    // server. Sequential rather than parallel because the in-process
    // socket pool is small and a parallel burst yields ECONNRESET
    // before we can measure auth behaviour. Sequential still validates
    // the safety property: every attempt returns a clean 401 (or 429
    // if a future PR adds a rate limiter), and the login path stays
    // responsive across all 100.
    const attempts = 100;
    const statuses: number[] = [];
    for (let i = 0; i < attempts; i++) {
      const r = await request(ctx.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'rate-limit@org.test', password: `wrong-${i}` });
      statuses.push(r.status);
    }

    // The api currently returns 401 for every invalid-credentials attempt
    // and does NOT have a rate limiter (see issue #11 from PR #13). What
    // this test enforces today: no 5xx error under burst — the auth path
    // is at least stable. Whether 429 should appear is tracked separately.
    const fiveXx = statuses.filter((s) => s >= 500).length;
    expect(fiveXx).toBe(0);

    // Every status should be in the auth-decision band. If a future PR
    // adds a rate limiter, 429 will appear here and this assertion still
    // holds; the test does not require 429 to exist today.
    const inBand = statuses.every((s) => s === 401 || s === 429);
    expect(inBand).toBe(true);
  });

  it('repeated invalid-token requests do not corrupt server state', async () => {
    // Send 50 bursts of obviously-bad tokens. Afterwards a real login
    // must still succeed — the first attempt must not have leaked the
    // user pool, exhausted JWT memory, or otherwise destabilised auth.
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'recovery@org.test',
      password: 'Password1',
    });

    // 50 attempts run sequentially for the same socket-pool reason as
    // the burst test above.
    for (let i = 0; i < 50; i++) {
      await request(ctx.app.getHttpServer())
        .get('/api/v1/contractors')
        .set('Authorization', `Bearer not-a-real-token-${i}`);
    }

    const recovery = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'Password1' })
      .expect(200);
    expect(recovery.body.data.accessToken).toEqual(expect.any(String));
  });
});
