import request from 'supertest';
import {
  ContractorStatus,
  EngagementStatus,
  InvoiceStatus,
  UserRole,
} from '@contractor-os/shared';
import { createTestApp, type TestAppContext } from '../setup/test-app';
import { resetDatabase } from '../setup/db-utils';
import { createOrg, createUser, createContractor, createEngagement } from '../factories';
import { authHeader, loginAs } from '../setup/auth-helper';

interface Fixtures {
  orgId: string;
  adminToken: string;
  contractorToken: string;
  contractorId: string;
  engagementId: string;
}

async function buildFixtures(ctx: TestAppContext): Promise<Fixtures> {
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
  const engagement = await createEngagement({
    pool: ctx.pool,
    orgId: org.id,
    contractorId: contractor.id,
    status: EngagementStatus.ACTIVE,
  });

  const adminLogin = await loginAs(ctx.app, admin.email, admin.password);
  const contractorLogin = await loginAs(ctx.app, contractor.email, contractor.password);

  return {
    orgId: org.id,
    adminToken: adminLogin.accessToken,
    contractorToken: contractorLogin.accessToken,
    contractorId: contractor.id,
    engagementId: engagement.id,
  };
}

const lineItems = () => [
  { description: 'API design hours', quantity: 8, unitPrice: 125 },
  { description: 'Implementation hours', quantity: 16, unitPrice: 125 },
];

describe('Integration: Invoice state machine', () => {
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

  it('happy path: draft → submitted → approved → scheduled → paid (terminal)', async () => {
    const fx = await buildFixtures(ctx);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/invoices')
      .set(authHeader(fx.contractorToken))
      .send({
        engagementId: fx.engagementId,
        invoiceNumber: 'INV-HAPPY-001',
        periodStart: '2026-04-01',
        periodEnd: '2026-04-30',
        lineItems: lineItems(),
      })
      .expect(201);

    const invoiceId = create.body.data.id as string;

    let row = await ctx.pool.query<{ status: string }>('SELECT status FROM invoices WHERE id = $1', [
      invoiceId,
    ]);
    expect(row.rows[0].status).toBe(InvoiceStatus.DRAFT);

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/submit`)
      .set(authHeader(fx.contractorToken))
      .expect(201);
    row = await ctx.pool.query('SELECT status FROM invoices WHERE id = $1', [invoiceId]);
    expect(row.rows[0].status).toBe(InvoiceStatus.SUBMITTED);

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/approve`)
      .set(authHeader(fx.adminToken))
      .send({ notes: 'Looks good' })
      .expect(201);
    row = await ctx.pool.query('SELECT status FROM invoices WHERE id = $1', [invoiceId]);
    expect(row.rows[0].status).toBe(InvoiceStatus.APPROVED);

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/schedule`)
      .set(authHeader(fx.adminToken))
      .send({ paymentDate: '2026-05-15' })
      .expect(201);
    row = await ctx.pool.query('SELECT status FROM invoices WHERE id = $1', [invoiceId]);
    expect(row.rows[0].status).toBe(InvoiceStatus.SCHEDULED);

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/mark-paid`)
      .set(authHeader(fx.adminToken))
      .send({ paidAt: '2026-05-15T12:00:00.000Z', referenceNumber: 'WIRE-42' })
      .expect(201);

    row = await ctx.pool.query('SELECT status FROM invoices WHERE id = $1', [invoiceId]);
    expect(row.rows[0].status).toBe(InvoiceStatus.PAID);

    const history = await ctx.pool.query<{ from_status: string; to_status: string }>(
      'SELECT from_status, to_status FROM invoice_status_history WHERE invoice_id = $1 ORDER BY created_at',
      [invoiceId],
    );
    const transitions = history.rows.map((h) => `${h.from_status}->${h.to_status}`);
    expect(transitions).toEqual(
      expect.arrayContaining([
        'draft->submitted',
        'under_review->approved',
        'approved->scheduled',
        'scheduled->paid',
      ]),
    );
  });

  it('unhappy path: draft → submitted → rejected (terminal) and no further transitions allowed', async () => {
    const fx = await buildFixtures(ctx);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/invoices')
      .set(authHeader(fx.contractorToken))
      .send({
        engagementId: fx.engagementId,
        invoiceNumber: 'INV-REJ-001',
        periodStart: '2026-04-01',
        periodEnd: '2026-04-30',
        lineItems: lineItems(),
      })
      .expect(201);
    const invoiceId = create.body.data.id as string;

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/submit`)
      .set(authHeader(fx.contractorToken))
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/reject`)
      .set(authHeader(fx.adminToken))
      .send({ reason: 'Period overlaps with previous invoice' })
      .expect(201);

    const row = await ctx.pool.query<{ status: string }>(
      'SELECT status FROM invoices WHERE id = $1',
      [invoiceId],
    );
    expect(row.rows[0].status).toBe(InvoiceStatus.REJECTED);

    // Re-submission attempt from a terminal status must be rejected
    const retry = await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/submit`)
      .set(authHeader(fx.contractorToken));
    expect(retry.status).toBeGreaterThanOrEqual(400);
    expect(retry.status).toBeLessThan(500);
  });

  it('unhappy path: draft → cancelled by contractor leaves the invoice in a terminal state', async () => {
    const fx = await buildFixtures(ctx);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/invoices')
      .set(authHeader(fx.contractorToken))
      .send({
        engagementId: fx.engagementId,
        invoiceNumber: 'INV-CANCEL-001',
        periodStart: '2026-04-01',
        periodEnd: '2026-04-30',
        lineItems: lineItems(),
      })
      .expect(201);
    const invoiceId = create.body.data.id as string;

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/cancel`)
      .set(authHeader(fx.contractorToken))
      .expect(201);

    const row = await ctx.pool.query<{ status: string }>(
      'SELECT status FROM invoices WHERE id = $1',
      [invoiceId],
    );
    expect(row.rows[0].status).toBe(InvoiceStatus.CANCELLED);
  });

  it('rejects a draft invoice with zero line items at the validation pipe', async () => {
    const fx = await buildFixtures(ctx);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/invoices')
      .set(authHeader(fx.contractorToken))
      .send({
        engagementId: fx.engagementId,
        invoiceNumber: 'INV-EMPTY-001',
        periodStart: '2026-04-01',
        periodEnd: '2026-04-30',
        lineItems: [],
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('natural-key idempotency: a second create for the same (org, invoice_number) is rejected and the first row is unchanged', async () => {
    const fx = await buildFixtures(ctx);

    const payload = {
      engagementId: fx.engagementId,
      invoiceNumber: 'INV-IDEMPO-001',
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
      lineItems: lineItems(),
    };

    const first = await request(ctx.app.getHttpServer())
      .post('/api/v1/invoices')
      .set(authHeader(fx.contractorToken))
      .send(payload)
      .expect(201);
    const firstId = first.body.data.id as string;

    const second = await request(ctx.app.getHttpServer())
      .post('/api/v1/invoices')
      .set(authHeader(fx.contractorToken))
      .send(payload);
    // Either the system returns 2xx with the same id (full Idempotency-Key
    // semantics) or any non-2xx because a duplicate natural key is rejected.
    // What must hold either way: only ONE row exists with this number, and
    // it is the first one we created.
    if (second.status >= 200 && second.status < 300) {
      expect(second.body.data.id).toBe(firstId);
    } else {
      expect(second.status).toBeGreaterThanOrEqual(400);
    }

    const rows = await ctx.pool.query<{ id: string; status: string }>(
      'SELECT id, status FROM invoices WHERE invoice_number = $1',
      [payload.invoiceNumber],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].id).toBe(firstId);
    expect(rows.rows[0].status).toBe(InvoiceStatus.DRAFT);
  });
});
