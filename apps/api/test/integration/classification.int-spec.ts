import request from 'supertest';
import {
  ContractorStatus,
  EngagementStatus,
  RiskLevel,
  UserRole,
} from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import {
  createOrg,
  createUser,
  createContractor,
  createEngagement,
} from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

describe('Integration: Classification risk evaluation', () => {
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

  it('low-risk profile: a contractor with independent factors yields a low/medium overall risk', async () => {
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
    await createEngagement({
      pool: ctx.pool,
      orgId: org.id,
      contractorId: contractor.id,
      status: EngagementStatus.ACTIVE,
    });

    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    // Submit factors that point to genuine independence
    const factorBody = (
      category: string,
      value: { booleanValue?: boolean; numericValue?: number },
    ) => ({
      category,
      ...value,
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
    });

    const independent = [
      factorBody('hours_per_week', { numericValue: 12 }),
      factorBody('engagement_duration_weeks', { numericValue: 8 }),
      factorBody('exclusivity_ratio', { numericValue: 0.2 }),
      factorBody('set_schedule', { booleanValue: false }),
      factorBody('tools_provided', { booleanValue: false }),
      factorBody('training_provided', { booleanValue: false }),
      factorBody('supervision_level', { numericValue: 1 }),
      factorBody('integration_level', { numericValue: 1 }),
      factorBody('multiple_clients', { booleanValue: true }),
      factorBody('profit_loss_opportunity', { booleanValue: true }),
      factorBody('significant_investment', { booleanValue: true }),
    ];

    for (const f of independent) {
      await request(ctx.app.getHttpServer())
        .post(`/api/v1/classification/factors/${contractor.id}`)
        .set(authHeader(accessToken))
        .send(f)
        .expect(201);
    }

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/v1/contractors/${contractor.id}/risk-assessment/run`)
      .set(authHeader(accessToken))
      .expect(201);

    expect(res.body.data.overallRisk).toEqual(expect.any(String));
    expect([RiskLevel.LOW, RiskLevel.MEDIUM]).toContain(res.body.data.overallRisk);

    const persisted = await ctx.pool.query<{ overall_risk: string }>(
      'SELECT overall_risk FROM classification_assessments WHERE contractor_id = $1',
      [contractor.id],
    );
    expect(persisted.rows).toHaveLength(1);
  });

  it('high-risk profile: a contractor with employee-like factors yields a high or critical risk', async () => {
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
    await createEngagement({
      pool: ctx.pool,
      orgId: org.id,
      contractorId: contractor.id,
      status: EngagementStatus.ACTIVE,
    });

    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    const factorBody = (
      category: string,
      value: { booleanValue?: boolean; numericValue?: number },
    ) => ({
      category,
      ...value,
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
    });

    const employeeLike = [
      factorBody('hours_per_week', { numericValue: 40 }),
      factorBody('engagement_duration_weeks', { numericValue: 80 }),
      factorBody('exclusivity_ratio', { numericValue: 1.0 }),
      factorBody('set_schedule', { booleanValue: true }),
      factorBody('tools_provided', { booleanValue: true }),
      factorBody('training_provided', { booleanValue: true }),
      factorBody('supervision_level', { numericValue: 5 }),
      factorBody('integration_level', { numericValue: 5 }),
      factorBody('multiple_clients', { booleanValue: false }),
      factorBody('profit_loss_opportunity', { booleanValue: false }),
      factorBody('significant_investment', { booleanValue: false }),
    ];

    for (const f of employeeLike) {
      await request(ctx.app.getHttpServer())
        .post(`/api/v1/classification/factors/${contractor.id}`)
        .set(authHeader(accessToken))
        .send(f)
        .expect(201);
    }

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/v1/contractors/${contractor.id}/risk-assessment/run`)
      .set(authHeader(accessToken))
      .expect(201);

    expect([RiskLevel.HIGH, RiskLevel.CRITICAL]).toContain(res.body.data.overallRisk);

    const persisted = await ctx.pool.query<{ overall_risk: string; overall_score: string }>(
      'SELECT overall_risk, overall_score FROM classification_assessments WHERE contractor_id = $1',
      [contractor.id],
    );
    expect(persisted.rows[0]).toBeDefined();
    expect(parseFloat(persisted.rows[0].overall_score)).toBeGreaterThan(50);
  });
});
