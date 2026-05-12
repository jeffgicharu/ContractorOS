import request from 'supertest';
import { UserRole, ContractorStatus } from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import {
  createOrg,
  createUser,
  createContractor,
  createEngagement,
  createInvoice,
} from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

describe('Integration: Multi-tenant isolation', () => {
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

  it('list endpoint hides contractors that belong to a different organization', async () => {
    const orgA = await createOrg(ctx.pool, { name: 'Org A', slug: 'org-a' });
    const orgB = await createOrg(ctx.pool, { name: 'Org B', slug: 'org-b' });

    const adminA = await createUser({
      pool: ctx.pool,
      orgId: orgA.id,
      role: UserRole.ADMIN,
      email: 'admin-a@org.test',
    });

    await createContractor({
      pool: ctx.pool,
      orgId: orgA.id,
      email: 'casey-a@org.test',
      firstName: 'Casey',
      lastName: 'A',
    });
    await createContractor({
      pool: ctx.pool,
      orgId: orgB.id,
      email: 'dana-b@org.test',
      firstName: 'Dana',
      lastName: 'B',
    });

    const { accessToken } = await loginAs(ctx.app, adminA.email, adminA.password);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/contractors')
      .set(authHeader(accessToken))
      .expect(200);

    const emails: string[] = res.body.data.map((c: { email: string }) => c.email);
    expect(emails).toContain('casey-a@org.test');
    expect(emails).not.toContain('dana-b@org.test');
    expect(res.body.meta.total).toBe(1);
  });

  it('detail endpoint returns 404 (not 403) when reading a contractor in another org', async () => {
    const orgA = await createOrg(ctx.pool);
    const orgB = await createOrg(ctx.pool);

    const adminA = await createUser({
      pool: ctx.pool,
      orgId: orgA.id,
      role: UserRole.ADMIN,
    });
    const contractorB = await createContractor({ pool: ctx.pool, orgId: orgB.id });

    const { accessToken } = await loginAs(ctx.app, adminA.email, adminA.password);

    await request(ctx.app.getHttpServer())
      .get(`/api/v1/contractors/${contractorB.id}`)
      .set(authHeader(accessToken))
      .expect(404);
  });

  it('rejects a write attempt that targets an invoice in a different organization', async () => {
    const orgA = await createOrg(ctx.pool);
    const orgB = await createOrg(ctx.pool);

    const adminA = await createUser({
      pool: ctx.pool,
      orgId: orgA.id,
      role: UserRole.ADMIN,
    });

    // Org B has a contractor + active engagement + a submitted invoice
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
    const invoiceB = await createInvoice({
      pool: ctx.pool,
      orgId: orgB.id,
      contractorId: contractorB.id,
      engagementId: engB.id,
      status: 'submitted' as const as never,
    });

    const { accessToken } = await loginAs(ctx.app, adminA.email, adminA.password);

    // Admin A tries to approve an Org B invoice. The cross-org call must not
    // succeed end-to-end — the only acceptable outcome is a non-2xx response
    // and the invoice never reaching an approved or paid status.
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceB.id}/approve`)
      .set(authHeader(accessToken))
      .send({ notes: 'cross-tenant attempt' });

    expect(res.status).toBeGreaterThanOrEqual(400);

    const after = await ctx.pool.query<{ status: string }>(
      'SELECT status FROM invoices WHERE id = $1',
      [invoiceB.id],
    );
    expect(after.rows[0].status).not.toBe('approved');
    expect(after.rows[0].status).not.toBe('paid');
  });

  it('list of invoices for a contractor is scoped to the caller’s org', async () => {
    const orgA = await createOrg(ctx.pool);
    const orgB = await createOrg(ctx.pool);

    const adminA = await createUser({
      pool: ctx.pool,
      orgId: orgA.id,
      role: UserRole.ADMIN,
    });

    const cA = await createContractor({ pool: ctx.pool, orgId: orgA.id });
    const cB = await createContractor({ pool: ctx.pool, orgId: orgB.id });

    const eA = await createEngagement({
      pool: ctx.pool,
      orgId: orgA.id,
      contractorId: cA.id,
    });
    const eB = await createEngagement({
      pool: ctx.pool,
      orgId: orgB.id,
      contractorId: cB.id,
    });

    await createInvoice({
      pool: ctx.pool,
      orgId: orgA.id,
      contractorId: cA.id,
      engagementId: eA.id,
      invoiceNumber: 'A-001',
    });
    await createInvoice({
      pool: ctx.pool,
      orgId: orgB.id,
      contractorId: cB.id,
      engagementId: eB.id,
      invoiceNumber: 'B-001',
    });

    const { accessToken } = await loginAs(ctx.app, adminA.email, adminA.password);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/invoices')
      .set(authHeader(accessToken))
      .expect(200);

    const numbers: string[] = res.body.data.map(
      (i: { invoiceNumber: string }) => i.invoiceNumber,
    );
    expect(numbers).toContain('A-001');
    expect(numbers).not.toContain('B-001');
  });
});
