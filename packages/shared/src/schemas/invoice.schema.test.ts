import { describe, it, expect } from 'vitest';
import {
  createInvoiceSchema,
  rejectInvoiceSchema,
  scheduleInvoiceSchema,
  markPaidSchema,
  invoiceListQuerySchema,
} from './invoice.schema';

const validLineItem = { description: 'Hours', quantity: 8, unitPrice: 125 };
const validInvoice = {
  engagementId: '11111111-1111-1111-1111-111111111111',
  invoiceNumber: 'INV-001',
  periodStart: '2026-04-01',
  periodEnd: '2026-04-30',
  lineItems: [validLineItem],
};

describe('createInvoiceSchema', () => {
  it('accepts a valid invoice with one line item', () => {
    expect(createInvoiceSchema.safeParse(validInvoice).success).toBe(true);
  });

  it('rejects zero line items', () => {
    const r = createInvoiceSchema.safeParse({ ...validInvoice, lineItems: [] });
    expect(r.success).toBe(false);
  });

  it('rejects periodEnd earlier than periodStart', () => {
    const r = createInvoiceSchema.safeParse({
      ...validInvoice,
      periodStart: '2026-04-30',
      periodEnd: '2026-04-01',
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toContain('periodEnd');
  });

  it('rejects a non-UUID engagementId', () => {
    expect(
      createInvoiceSchema.safeParse({ ...validInvoice, engagementId: 'not-a-uuid' }).success,
    ).toBe(false);
  });

  it('rejects a line item with zero quantity', () => {
    expect(
      createInvoiceSchema.safeParse({
        ...validInvoice,
        lineItems: [{ ...validLineItem, quantity: 0 }],
      }).success,
    ).toBe(false);
  });

  it('rejects a line item with a negative unitPrice', () => {
    expect(
      createInvoiceSchema.safeParse({
        ...validInvoice,
        lineItems: [{ ...validLineItem, unitPrice: -1 }],
      }).success,
    ).toBe(false);
  });
});

describe('rejectInvoiceSchema', () => {
  it('requires a non-empty reason', () => {
    expect(rejectInvoiceSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(rejectInvoiceSchema.safeParse({ reason: 'Inflated hours' }).success).toBe(true);
  });
});

describe('scheduleInvoiceSchema', () => {
  it('accepts a YYYY-MM-DD date', () => {
    expect(scheduleInvoiceSchema.safeParse({ paymentDate: '2026-05-15' }).success).toBe(true);
  });
  it('rejects a malformed date', () => {
    expect(scheduleInvoiceSchema.safeParse({ paymentDate: '15-05-2026' }).success).toBe(false);
  });
});

describe('markPaidSchema', () => {
  it('accepts a full ISO datetime', () => {
    expect(
      markPaidSchema.safeParse({
        paidAt: '2026-05-15T12:00:00.000Z',
        referenceNumber: 'WIRE-42',
      }).success,
    ).toBe(true);
  });
  it('rejects a date-only string', () => {
    expect(markPaidSchema.safeParse({ paidAt: '2026-05-15' }).success).toBe(false);
  });
});

describe('invoiceListQuerySchema', () => {
  it('coerces page and pageSize from strings', () => {
    const out = invoiceListQuerySchema.parse({ page: '3', pageSize: '50' });
    expect(out.page).toBe(3);
    expect(out.pageSize).toBe(50);
  });

  it('caps pageSize at 100', () => {
    expect(invoiceListQuerySchema.safeParse({ pageSize: 200 }).success).toBe(false);
  });
});
