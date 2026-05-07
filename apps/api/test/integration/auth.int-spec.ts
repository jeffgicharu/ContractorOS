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
});
