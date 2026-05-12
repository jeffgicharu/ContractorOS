import request from 'supertest';
import { ContractorStatus, UserRole } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser } from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

describe('Integration: Contractor onboarding', () => {
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

  it('admin creates a contractor; the contractor row is in invite_sent and onboarding steps are seeded', async () => {
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
        email: 'new-hire@org.test',
        firstName: 'New',
        lastName: 'Hire',
        type: 'domestic',
      })
      .expect(201);

    const contractorId = res.body.data.id;
    expect(contractorId).toEqual(expect.any(String));

    const row = await ctx.pool.query<{ status: ContractorStatus; invite_token: string }>(
      'SELECT status, invite_token FROM contractors WHERE id = $1',
      [contractorId],
    );
    expect(row.rows[0].status).toBe(ContractorStatus.INVITE_SENT);
    expect(row.rows[0].invite_token).toEqual(expect.any(String));

    const steps = await ctx.pool.query<{ step_type: string; status: string }>(
      'SELECT step_type, status FROM onboarding_steps WHERE contractor_id = $1 ORDER BY step_type',
      [contractorId],
    );
    expect(steps.rows.length).toBeGreaterThanOrEqual(1);
    expect(steps.rows.every((s) => s.status === 'pending')).toBe(true);
  });

  it('rejects a duplicate contractor email within the same organization', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    const payload = {
      email: 'dup@org.test',
      firstName: 'Dup',
      lastName: 'Email',
      type: 'domestic',
    };

    await request(ctx.app.getHttpServer())
      .post('/api/v1/contractors')
      .set(authHeader(accessToken))
      .send(payload)
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post('/api/v1/contractors')
      .set(authHeader(accessToken))
      .send(payload)
      .expect(409);
  });

  it('contractor accepts the invite token and transitions out of invite_sent', async () => {
    const org = await createOrg(ctx.pool);
    const admin = await createUser({
      pool: ctx.pool,
      orgId: org.id,
      role: UserRole.ADMIN,
    });
    const { accessToken } = await loginAs(ctx.app, admin.email, admin.password);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/contractors')
      .set(authHeader(accessToken))
      .send({
        email: 'invitee@org.test',
        firstName: 'Invite',
        lastName: 'Accept',
        type: 'domestic',
      })
      .expect(201);

    const tokenRow = await ctx.pool.query<{ invite_token: string }>(
      'SELECT invite_token FROM contractors WHERE id = $1',
      [create.body.data.id],
    );
    const inviteToken = tokenRow.rows[0].invite_token;

    await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/invite/accept')
      .send({
        token: inviteToken,
        password: 'StrongPass1',
        firstName: 'Invite',
        lastName: 'Accept',
      })
      .expect(200);

    const updated = await ctx.pool.query<{ status: ContractorStatus }>(
      'SELECT status FROM contractors WHERE id = $1',
      [create.body.data.id],
    );
    expect(updated.rows[0].status).not.toBe(ContractorStatus.INVITE_SENT);
  });
});
