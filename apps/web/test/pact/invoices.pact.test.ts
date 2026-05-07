import { describe, it, expect } from 'vitest';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import {
  CONSUMER,
  PROVIDER,
  PACT_DIR,
  ADMIN_BEARER,
  CONTRACTOR_BEARER,
  ENGAGEMENT_ID,
  DRAFT_INVOICE_ID,
  SUBMITTED_INVOICE_ID,
} from './constants';

const { string, like } = MatchersV3;

const provider = new PactV3({
  consumer: CONSUMER,
  provider: PROVIDER,
  dir: PACT_DIR,
});

describe('Pact: POST /api/v1/invoices', () => {
  it('201 + new invoice for a contractor against an active engagement', async () => {
    provider
      .given(`an active engagement ${ENGAGEMENT_ID} exists for the contractor in org A`)
      .uponReceiving('a contractor creating an invoice with one line item')
      .withRequest({
        method: 'POST',
        path: '/api/v1/invoices',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CONTRACTOR_BEARER}`,
        },
        body: {
          engagementId: ENGAGEMENT_ID,
          invoiceNumber: 'PACT-INV-001',
          periodStart: '2026-04-01',
          periodEnd: '2026-04-30',
          lineItems: [{ description: 'Hours', quantity: 8, unitPrice: 125 }],
        },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          data: like({
            id: string('33333333-3333-3333-3333-333333333333'),
            status: 'draft',
            invoiceNumber: 'PACT-INV-001',
          }),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/v1/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CONTRACTOR_BEARER}`,
        },
        body: JSON.stringify({
          engagementId: ENGAGEMENT_ID,
          invoiceNumber: 'PACT-INV-001',
          periodStart: '2026-04-01',
          periodEnd: '2026-04-30',
          lineItems: [{ description: 'Hours', quantity: 8, unitPrice: 125 }],
        }),
      });
      expect(res.status).toBe(201);
    });
  });

  it('400 VALIDATION_ERROR for an invoice with zero line items', async () => {
    provider
      .given(`an active engagement ${ENGAGEMENT_ID} exists for the contractor in org A`)
      .uponReceiving('a contractor creating an invoice with zero line items')
      .withRequest({
        method: 'POST',
        path: '/api/v1/invoices',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CONTRACTOR_BEARER}`,
        },
        body: {
          engagementId: ENGAGEMENT_ID,
          invoiceNumber: 'PACT-INV-EMPTY',
          periodStart: '2026-04-01',
          periodEnd: '2026-04-30',
          lineItems: [],
        },
      })
      .willRespondWith({
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: like('Request validation failed'),
            details: like({ lineItems: ['At least one line item is required'] }),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/v1/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CONTRACTOR_BEARER}`,
        },
        body: JSON.stringify({
          engagementId: ENGAGEMENT_ID,
          invoiceNumber: 'PACT-INV-EMPTY',
          periodStart: '2026-04-01',
          periodEnd: '2026-04-30',
          lineItems: [],
        }),
      });
      expect(res.status).toBe(400);
    });
  });
});

describe('Pact: GET /api/v1/invoices/:id', () => {
  it('200 + invoice detail for a draft invoice the contractor owns', async () => {
    provider
      .given(`a draft invoice ${DRAFT_INVOICE_ID} exists for the engagement in org A`)
      .uponReceiving('a contractor reading their own draft invoice')
      .withRequest({
        method: 'GET',
        path: `/api/v1/invoices/${DRAFT_INVOICE_ID}`,
        headers: { Authorization: `Bearer ${CONTRACTOR_BEARER}` },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          data: like({
            id: DRAFT_INVOICE_ID,
            status: 'draft',
            invoiceNumber: 'SEED-INV-001',
            totalAmount: 1000,
          }),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/v1/invoices/${DRAFT_INVOICE_ID}`, {
        headers: { Authorization: `Bearer ${CONTRACTOR_BEARER}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { id: string; status: string } };
      expect(body.data.id).toBe(DRAFT_INVOICE_ID);
    });
  });
});

describe('Pact: POST /api/v1/invoices/:id/submit', () => {
  it('201 + acknowledgement when the contractor submits a draft invoice', async () => {
    provider
      .given(`a draft invoice ${DRAFT_INVOICE_ID} exists for the engagement in org A`)
      .uponReceiving('a contractor submitting their draft invoice')
      .withRequest({
        method: 'POST',
        path: `/api/v1/invoices/${DRAFT_INVOICE_ID}/submit`,
        headers: { Authorization: `Bearer ${CONTRACTOR_BEARER}` },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          data: like({ message: 'Invoice submitted' }),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(
        `${mockServer.url}/api/v1/invoices/${DRAFT_INVOICE_ID}/submit`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${CONTRACTOR_BEARER}` },
        },
      );
      expect(res.status).toBe(201);
    });
  });
});

describe('Pact: POST /api/v1/invoices/:id/approve', () => {
  it('201 + acknowledgement when the admin approves a submitted invoice', async () => {
    provider
      .given(
        `a submitted invoice ${SUBMITTED_INVOICE_ID} exists for the engagement in org A`,
      )
      .uponReceiving('an admin approving a submitted invoice')
      .withRequest({
        method: 'POST',
        path: `/api/v1/invoices/${SUBMITTED_INVOICE_ID}/approve`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_BEARER}`,
        },
        body: { notes: 'Looks good' },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          data: like({ message: 'Invoice approved' }),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(
        `${mockServer.url}/api/v1/invoices/${SUBMITTED_INVOICE_ID}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ADMIN_BEARER}`,
          },
          body: JSON.stringify({ notes: 'Looks good' }),
        },
      );
      expect(res.status).toBe(201);
    });
  });
});
