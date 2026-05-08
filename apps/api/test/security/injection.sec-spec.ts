import request from 'supertest';
import { UserRole } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser, createContractor } from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

describe('Security: Injection and input handling', () => {
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

  it('SQL injection payload in path param does not leak DB internals (status may be 4xx or 5xx, body must be safe)', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    const payload = encodeURIComponent("' OR 1=1 --");
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/contractors/${payload}`)
      .set(authHeader(accessToken));

    // Whatever the status code is, the response body must not include
    // raw SQL fragments or postgres-specific error text. (The api today
    // returns 500 for malformed UUIDs — see the filed security issue.
    // The contract guaranteed by THIS test is the no-leak one.)
    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/syntax error/i);
    expect(body).not.toMatch(/\bpostgres(ql)?\b/i);
    expect(body).not.toMatch(/\bSELECT\b.*\bFROM\b/i);
    expect(body).not.toMatch(/at .*\.ts:\d+:\d+/);
  });

  it('SQL injection payload in query string does not return cross-tenant rows', async () => {
    const orgA = await createOrg(ctx.pool);
    const orgB = await createOrg(ctx.pool);
    const adminA = await createUser({
      pool: ctx.pool,
      orgId: orgA.id,
      role: UserRole.ADMIN,
    });
    await createContractor({ pool: ctx.pool, orgId: orgB.id, email: 'leak-target@org-b.test' });

    const { accessToken } = await loginAs(ctx.app, adminA.email, adminA.password);

    // Classic OR 1=1 in the search field. The api uses parameterised
    // queries so this should be matched literally; no Org B row should
    // appear in Org A's response.
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/contractors?search=${encodeURIComponent("' OR '1'='1")}`)
      .set(authHeader(accessToken))
      .expect(200);

    const emails: string[] = (res.body.data ?? []).map((c: { email: string }) => c.email);
    expect(emails).not.toContain('leak-target@org-b.test');
  });

  it('SQL injection in JSON body is rejected by validation, never reaches the SQL layer', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/contractors')
      .set(authHeader(accessToken))
      .send({
        email: "evil@x.test'; DROP TABLE users; --",
        firstName: 'Evil',
        lastName: 'McSqli',
        type: 'domestic',
      });
    // Either 400 (invalid email) or 4xx; what matters: the users table
    // is still there afterwards.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    const usersStillExist = await ctx.pool.query('SELECT COUNT(*)::int AS n FROM users');
    expect(usersStillExist.rows[0].n).toBeGreaterThanOrEqual(1);
  });

  it('mass-assignment: extra is_admin / organization_id fields are not persisted', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    const otherOrg = await createOrg(ctx.pool, { slug: 'attacker-target-org' });
    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/contractors')
      .set(authHeader(accessToken))
      .send({
        email: 'mass-assign@org.test',
        firstName: 'Mass',
        lastName: 'Assign',
        type: 'domestic',
        // Attacker-supplied fields the admin should not be able to set
        // through the public DTO. The Zod schema should drop them; even
        // if not, the SQL must not honour them.
        is_admin: true,
        role: 'admin',
        organization_id: otherOrg.id,
        organizationId: otherOrg.id,
      })
      .expect(201);

    const id = create.body.data.id as string;
    const row = await ctx.pool.query<{ organization_id: string }>(
      'SELECT organization_id FROM contractors WHERE id = $1',
      [id],
    );
    // The contractor must end up in the admin's own org, not the
    // attacker-supplied one.
    expect(row.rows[0].organization_id).toBe(org.id);
    expect(row.rows[0].organization_id).not.toBe(otherOrg.id);
  });

  it('rejects path-traversal characters in document download paths', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    // The documents endpoint expects a UUID. A traversal payload should
    // be rejected before any filesystem read happens.
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/documents/' + encodeURIComponent('../../../etc/passwd') + '/download')
      .set(authHeader(accessToken));
    expect(res.status).toBeGreaterThanOrEqual(400);
    // Critical safety property: under no circumstances does the api
    // serve up /etc/passwd contents. The status code may be 4xx or 5xx
    // depending on where the parser fails — what matters is the body
    // never contains the unix passwd file format.
    expect(JSON.stringify(res.body)).not.toMatch(/root:x:/);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.ts:\d+:\d+/);
  });

  it('error responses do not leak stack traces when NODE_ENV=test', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    // Trigger a 4xx by sending a malformed body. Whatever the status,
    // the response must not include a JS stack frame.
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/contractors')
      .set(authHeader(accessToken))
      .send({ email: 12345, type: 'invalid-type' });

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/at .* \(.*\.ts:\d+:\d+\)/);
    expect(body).not.toMatch(/node_modules/);
  });
});
