import request from 'supertest';
import { ContractorStatus, EngagementStatus, UserRole } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser, createContractor } from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

describe('Integration: Engagement creation', () => {
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

  it('admin creates an engagement against an active contractor and a row exists with status=draft', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    const contractor = await createContractor({
      pool: ctx.pool,
      orgId: org.id,
      status: ContractorStatus.ACTIVE,
    });
    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/v1/contractors/${contractor.id}/engagements`)
      .set(authHeader(accessToken))
      .send({
        title: 'Q3 Backend Engagement',
        startDate: '2026-07-01',
        hourlyRate: 125,
      })
      .expect(201);

    expect(res.body.data.id).toEqual(expect.any(String));

    const row = await ctx.pool.query<{ status: string; hourly_rate: string }>(
      'SELECT status, hourly_rate FROM engagements WHERE id = $1',
      [res.body.data.id],
    );
    expect(row.rows[0].status).toBe(EngagementStatus.DRAFT);
    expect(parseFloat(row.rows[0].hourly_rate)).toBe(125);
  });

  for (const nonActiveStatus of [
    ContractorStatus.INVITE_SENT,
    ContractorStatus.TAX_FORM_PENDING,
    ContractorStatus.CONTRACT_PENDING,
    ContractorStatus.BANK_DETAILS_PENDING,
    ContractorStatus.SUSPENDED,
    ContractorStatus.OFFBOARDED,
  ] as const) {
    it(`rejects engagement creation when contractor is ${nonActiveStatus} (422 + CONTRACTOR_NOT_ACTIVE)`, async () => {
      const org = await createOrg(ctx.pool);
      const admin = await createUser({
        pool: ctx.pool,
        orgId: org.id,
        role: UserRole.ADMIN,
      });
      const contractor = await createContractor({
        pool: ctx.pool,
        orgId: org.id,
        status: nonActiveStatus,
      });
      const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

      const res = await request(ctx.app.getHttpServer())
        .post(`/api/v1/contractors/${contractor.id}/engagements`)
        .set(authHeader(accessToken))
        .send({
          title: 'Should be rejected',
          startDate: '2026-07-01',
          hourlyRate: 125,
        })
        .expect(422);

      expect(res.body.error.code).toBe('CONTRACTOR_NOT_ACTIVE');
      expect(res.body.error.message).toMatch(new RegExp(nonActiveStatus));

      const count = await ctx.pool.query<{ n: string }>(
        'SELECT COUNT(*)::text AS n FROM engagements WHERE contractor_id = $1',
        [contractor.id],
      );
      expect(count.rows[0].n).toBe('0');
    });
  }
});
