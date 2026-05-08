import request from 'supertest';
import { ContractorStatus, UserRole } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser, createContractor, createEngagement } from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

describe('Security: RBAC enforcement', () => {
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

  it('contractor cannot create another contractor (admin-only POST /contractors)', async () => {
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

  it('contractor cannot create an engagement on behalf of another contractor', async () => {
    const org = await createOrg(ctx.pool);
    const contractor = await createContractor({ pool: ctx.pool, orgId: org.id });
    const { accessToken } = await loginAs(ctx.app, contractor.email, contractor.password);

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/contractors/${contractor.id}/engagements`)
      .set(authHeader(accessToken))
      .send({
        title: 'Self-promote',
        startDate: '2026-07-01',
        hourlyRate: 999,
      })
      .expect(403);
  });

  it('contractor cannot read the audit log (admin-only GET /audit-log)', async () => {
    const org = await createOrg(ctx.pool);
    const contractor = await createContractor({ pool: ctx.pool, orgId: org.id });
    const { accessToken } = await loginAs(ctx.app, contractor.email, contractor.password);

    await request(ctx.app.getHttpServer())
      .get('/api/v1/audit-log')
      .set(authHeader(accessToken))
      .expect(403);
  });

  it('contractor cannot run a manual classification re-assessment (admin-only)', async () => {
    const org = await createOrg(ctx.pool);
    const contractor = await createContractor({ pool: ctx.pool, orgId: org.id });
    const { accessToken } = await loginAs(ctx.app, contractor.email, contractor.password);

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/v1/contractors/${contractor.id}/risk-assessment/run`)
      .set(authHeader(accessToken))
      .send({});
    expect(res.status).toBe(403);
  });

  it('Org A admin gets 404 (not 403) when reading an Org B contractor', async () => {
    const orgA = await createOrg(ctx.pool);
    const orgB = await createOrg(ctx.pool);
    const adminA = await createUser({
      pool: ctx.pool,
      orgId: orgA.id,
      role: UserRole.ADMIN,
    });
    const contractorB = await createContractor({ pool: ctx.pool, orgId: orgB.id });
    const { accessToken } = await loginAs(ctx.app, adminA.email, adminA.password);

    // 404 (rather than 403) prevents user-id enumeration across tenants.
    await request(ctx.app.getHttpServer())
      .get(`/api/v1/contractors/${contractorB.id}`)
      .set(authHeader(accessToken))
      .expect(404);
  });

  it('Org A admin cannot patch an engagement that belongs to Org B', async () => {
    const orgA = await createOrg(ctx.pool);
    const orgB = await createOrg(ctx.pool);
    const adminA = await createUser({
      pool: ctx.pool,
      orgId: orgA.id,
      role: UserRole.ADMIN,
    });

    const contractorB = await createContractor({
      pool: ctx.pool,
      orgId: orgB.id,
      status: ContractorStatus.ACTIVE,
    });
    const engB = await createEngagement({
      pool: ctx.pool,
      orgId: orgB.id,
      contractorId: contractorB.id,
    });

    const { accessToken } = await loginAs(ctx.app, adminA.email, adminA.password);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/engagements/${engB.id}`)
      .set(authHeader(accessToken))
      .send({ title: 'cross-tenant tamper' });
    expect([403, 404]).toContain(res.status);

    // Verify Org B's engagement was not actually modified
    const after = await ctx.pool.query<{ title: string }>(
      'SELECT title FROM engagements WHERE id = $1',
      [engB.id],
    );
    expect(after.rows[0].title).not.toBe('cross-tenant tamper');
  });
});
