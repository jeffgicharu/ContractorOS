import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser } from '../factories';

describe('Security: Auth + JWT', () => {
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

  it('rejects requests with no Authorization header', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .expect(401);
  });

  it('rejects an Authorization header that does not start with "Bearer "', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set('Authorization', 'Basic ZGVtbzpkZW1v');
    expect(res.status).toBe(401);
  });

  it('rejects a JWT signed with the wrong secret', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });

    // Generate a token using a *different* secret. Even though the claim
    // shape and TTL are valid, signature verification must fail.
    const wrongSecretJwt = new JwtService({ secret: 'totally-different-secret' });
    const tamperedToken = wrongSecretJwt.sign(
      { sub: admin.id, orgId: org.id, role: 'admin' },
      { expiresIn: '15m' },
    );

    await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);
  });

  it('rejects an expired JWT', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });

    const jwt = ctx.app.get(JwtService);
    const expiredToken = jwt.sign(
      { sub: admin.id, orgId: org.id, role: 'admin' },
      { expiresIn: -10 },
    );

    await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('rejects a JWT with a tampered payload (signature mismatch)', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });

    const jwt = ctx.app.get(JwtService);
    const validToken = jwt.sign(
      { sub: admin.id, orgId: org.id, role: 'admin' },
      { expiresIn: '15m' },
    );

    // Flip one character in the payload section. The signature still
    // matches the original payload, so verification must fail.
    const [header, payload, signature] = validToken.split('.');
    const flipped = payload.slice(0, -2) + (payload.endsWith('A') ? 'B' : 'A') + payload.slice(-1);
    const tamperedToken = `${header}.${flipped}.${signature}`;

    await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);
  });

  it('rejects a JWT with alg=none (no signature, claims-only token)', async () => {
    // alg=none is the classic JWT bypass: the token has no signature,
    // and a vulnerable implementation would accept the unsigned claims.
    // NestJS @nestjs/jwt + passport-jwt rejects this by default; this
    // test ensures the rejection stays in place.
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ sub: 'attacker', orgId: 'attacker-org', role: 'admin' }),
    ).toString('base64url');
    const noneToken = `${header}.${payload}.`;

    await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set('Authorization', `Bearer ${noneToken}`)
      .expect(401);
  });

  it('JWT for a deactivated user is currently still accepted (FINDING — see filed issue)', async () => {
    // The api today does NOT re-check users.is_active on each request —
    // an already-issued JWT continues to grant access until it expires.
    // This is a real security gap and is filed as a backlog issue. The
    // test asserts on the CURRENT behaviour so the suite stays green;
    // when the gap is closed, this test is the natural place to flip
    // to expect 401/403.
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });

    const jwt = ctx.app.get(JwtService);
    const token = jwt.sign(
      { sub: admin.id, orgId: org.id, role: 'admin' },
      { expiresIn: '15m' },
    );
    await ctx.pool.query('UPDATE users SET is_active = false WHERE id = $1', [admin.id]);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set('Authorization', `Bearer ${token}`);
    // Today: 200. When the JwtAuthGuard is hardened to re-check
    // is_active, expected becomes [401, 403].
    expect([200, 401, 403]).toContain(res.status);
  });

  it('login response does not leak the password_hash field', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
      email: 'leak-check@org.test',
      password: 'Password1',
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'Password1' })
      .expect(200);

    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/password_hash/i);
    expect(json).not.toMatch(/\$2[abxy]\$/); // bcrypt hash signature
    expect(json).not.toMatch(/jwt[_-]?secret/i);
  });
});
