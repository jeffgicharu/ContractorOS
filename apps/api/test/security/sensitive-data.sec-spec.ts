import request from 'supertest';
import { UserRole } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser } from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

describe('Security: Sensitive data handling', () => {
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

  it('audit_events rows do not include the password used for login', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'audit-sensitive@org.test',
      password: 'Sensitive!Password123',
    });

    // Trigger an audit-logged action: contractor create writes an audit
    // event with old/new values.
    const { accessToken } = await loginAs(ctx.app, admin.email, 'Sensitive!Password123');
    await request(ctx.app.getHttpServer())
      .post('/api/v1/contractors')
      .set(authHeader(accessToken))
      .send({
        email: 'no-leak@org.test',
        firstName: 'No',
        lastName: 'Leak',
        type: 'domestic',
      })
      .expect(201);

    const { rows } = await ctx.pool.query<{ json: string }>(
      "SELECT (COALESCE(old_values::text, '') || ' ' || COALESCE(new_values::text, '')) AS json FROM audit_events",
    );
    for (const r of rows) {
      expect(r.json).not.toMatch(/Sensitive!Password123/);
      expect(r.json).not.toMatch(/password_hash/i);
      expect(r.json).not.toMatch(/\$2[abxy]\$/); // bcrypt hash
    }
  });

  it('GET /contractors does not include user.password_hash in any row', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    // Seed two contractors with their own user records (createContractor
    // factory creates a user when withUser=true, which is the default).
    const { createContractor } = await import('../factories');
    await createContractor({ pool: ctx.pool, orgId: org.id, email: 'a@x.test' });
    await createContractor({ pool: ctx.pool, orgId: org.id, email: 'b@x.test' });

    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set(authHeader(accessToken))
      .expect(200);

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/password_hash/i);
    expect(body).not.toMatch(/\$2[abxy]\$/);
  });

  it('refresh-token cookie is HttpOnly and SameSite=Strict in every environment', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'cookie-check@org.test',
      password: 'Password1',
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'Password1' })
      .expect(200);

    const setCookie = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(setCookie)
      ? setCookie
      : typeof setCookie === 'string'
        ? [setCookie]
        : [];
    const refresh = cookies.find((c) => c.startsWith('refresh_token='));
    expect(refresh).toBeDefined();
    expect(refresh!).toMatch(/HttpOnly/i);
    // SameSite=Strict in every environment — the cookie is an
    // authentication credential and must never travel cross-site.
    expect(refresh!).toMatch(/SameSite=Strict/i);
  });

  it('X-Powered-By header is not present on any response', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'xpb@org.test',
      password: 'Password1',
    });

    // Unauthenticated probe — public surface should not fingerprint Express.
    const healthRes = await request(ctx.app.getHttpServer()).get('/api/v1/health');
    expect(healthRes.headers['x-powered-by']).toBeUndefined();

    // Auth/login response — sets cookies, still no X-Powered-By.
    const loginRes = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'Password1' });
    expect(loginRes.headers['x-powered-by']).toBeUndefined();

    // Authenticated probe — the header should not appear on protected routes either.
    const { accessToken } = await loginAs(ctx.app, admin.email, 'Password1');
    const listRes = await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set(authHeader(accessToken));
    expect(listRes.headers['x-powered-by']).toBeUndefined();

    // 4xx surface — error responses still must not leak the fingerprint.
    const notFoundRes = await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors/00000000-0000-4000-8000-deadbeefdead')
      .set(authHeader(accessToken));
    expect(notFoundRes.headers['x-powered-by']).toBeUndefined();
  });

  it('error envelope does not include node_modules paths or internal file paths', async () => {
    // Hit a route with no auth, then with an obviously-broken request.
    // The error envelope returned by HttpExceptionFilter must not contain
    // any internal source path that would help an attacker fingerprint
    // the framework version.
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/contractors');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/node_modules/);
    expect(body).not.toMatch(/\bsrc\/[a-z-]+\//);
    expect(body).not.toMatch(/at .*\.ts:\d+:\d+/);
  });
});
