import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser, createContractor } from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

describe('Integration: Auth', () => {
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

  it('logs an admin in and returns an access token plus refresh cookie', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'admin-login@org.test',
      password: 'Password1',
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'Password1' })
      .expect(200);

    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.id).toBe(admin.id);
    expect(res.body.data.user.role).toBe(UserRole.ADMIN);

    const setCookie = res.headers['set-cookie'];
    const cookieList = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
    expect(cookieList.some((c: string) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('rejects login with the wrong password', async () => {
    const org = await createOrg(ctx.pool);
    await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'admin-bad@org.test',
      password: 'Password1',
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin-bad@org.test', password: 'WrongPassword' })
      .expect(401);

    expect(res.body.error?.message ?? '').toBeTruthy();
    expect(res.body.data?.accessToken).toBeUndefined();
  });

  it('rejects requests with no token (missing Authorization header)', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .expect(401);
  });

  it('rejects requests with an expired JWT', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });

    const jwt = ctx.app.get(JwtService);
    const expiredToken = jwt.sign(
      { sub: admin.id, orgId: org.id, role: UserRole.ADMIN },
      { expiresIn: -10 },
    );

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set(authHeader(expiredToken))
      .expect(401);

    expect(res.body.error?.message ?? '').toBeTruthy();
  });

  it('rejects a contractor JWT against an admin-only route (wrong role)', async () => {
    const org = await createOrg(ctx.pool);
    const contractor = await createContractor({ pool: ctx.pool, orgId: org.id });
    const { accessToken } = await loginAs(ctx.app, contractor.email, contractor.password);

    await request(ctx.app.getHttpServer())
      .post('/api/v1/contractors')
      .set(authHeader(accessToken))
      .send({
        email: 'someone@new.test',
        firstName: 'New',
        lastName: 'Person',
        type: 'domestic',
      })
      .expect(403);
  });

  it('rejects a previously-issued JWT once the user is deactivated, without waiting for expiry', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'will-be-deactivated@org.test',
      password: 'Password1',
    });

    // Issue a JWT while the account is active.
    const { accessToken } = await loginAs(ctx.app, admin.email, 'Password1');

    // Sanity: the token works before deactivation.
    await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set(authHeader(accessToken))
      .expect(200);

    // Deactivate the user out-of-band.
    await ctx.pool.query('UPDATE users SET is_active = false WHERE id = $1', [admin.id]);

    // The very next request with the same JWT must now 401, even though
    // the token signature is still valid and the exp claim has not passed.
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set(authHeader(accessToken))
      .expect(401);
    expect(res.body.error?.message ?? '').toBeTruthy();
  });

  it('rejects a JWT whose subject has been deleted', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'will-be-deleted@org.test',
      password: 'Password1',
    });
    const { accessToken } = await loginAs(ctx.app, admin.email, 'Password1');
    await ctx.pool.query('DELETE FROM users WHERE id = $1', [admin.id]);

    await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set(authHeader(accessToken))
      .expect(401);
  });
});
