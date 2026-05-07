import { describe, it, expect } from 'vitest';
import {
  createEngagementSchema,
  updateEngagementStatusSchema,
  createTimeEntrySchema,
} from './engagement.schema';

describe('createEngagementSchema', () => {
  const baseValid = {
    title: 'Q3 Frontend Engagement',
    startDate: '2026-07-01',
    hourlyRate: 125,
  };

  it('accepts an hourly engagement', () => {
    expect(createEngagementSchema.safeParse(baseValid).success).toBe(true);
  });

  it('accepts a fixed-rate engagement', () => {
    const r = createEngagementSchema.safeParse({
      title: baseValid.title,
      startDate: baseValid.startDate,
      fixedRate: 12000,
    });
    expect(r.success).toBe(true);
  });

  it('rejects when neither rate is provided', () => {
    const r = createEngagementSchema.safeParse({
      title: baseValid.title,
      startDate: baseValid.startDate,
    });
    expect(r.success).toBe(false);
  });

  it('defaults paymentTerms to net_30 and currency to USD', () => {
    const r = createEngagementSchema.parse(baseValid);
    expect(r.paymentTerms).toBe('net_30');
    expect(r.currency).toBe('USD');
  });

  it('rejects a malformed startDate', () => {
    expect(
      createEngagementSchema.safeParse({ ...baseValid, startDate: '07-01-2026' }).success,
    ).toBe(false);
  });
});

describe('updateEngagementStatusSchema', () => {
  it('accepts each of the 5 statuses', () => {
    for (const status of ['draft', 'active', 'paused', 'completed', 'cancelled']) {
      expect(updateEngagementStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it('rejects an unknown status', () => {
    expect(updateEngagementStatusSchema.safeParse({ status: 'archived' }).success).toBe(false);
  });
});

describe('createTimeEntrySchema', () => {
  const valid = {
    engagementId: '22222222-2222-2222-2222-222222222222',
    entryDate: '2026-04-15',
    hours: 4.5,
    description: 'Implementation',
  };

  it('accepts a valid entry', () => {
    expect(createTimeEntrySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects more than 24 hours', () => {
    expect(createTimeEntrySchema.safeParse({ ...valid, hours: 25 }).success).toBe(false);
  });

  it('rejects zero hours', () => {
    expect(createTimeEntrySchema.safeParse({ ...valid, hours: 0 }).success).toBe(false);
  });
});
