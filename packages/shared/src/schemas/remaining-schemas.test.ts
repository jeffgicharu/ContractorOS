import { describe, it, expect } from 'vitest';
import { auditLogQuerySchema } from './audit.schema';
import {
  submitFactorSchema,
  assessmentHistoryQuerySchema,
  factorListQuerySchema,
} from './classification.schema';
import { notificationListQuerySchema } from './notification.schema';
import {
  initiateOffboardingSchema,
  updateOffboardingSchema,
  updateChecklistItemSchema,
  offboardingListQuerySchema,
} from './offboarding.schema';
import { completeOnboardingStepSchema } from './onboarding.schema';
import { updateOrganizationSettingsSchema } from './organization.schema';

describe('auditLogQuerySchema', () => {
  it('accepts an empty query (all fields optional)', () => {
    const result = auditLogQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });
  it('rejects a non-positive page number', () => {
    expect(auditLogQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });
});

describe('submitFactorSchema', () => {
  const valid = {
    category: 'hours_per_week',
    numericValue: 30,
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
  };

  it('accepts a valid factor submission', () => {
    expect(submitFactorSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an unknown category', () => {
    expect(submitFactorSchema.safeParse({ ...valid, category: 'mood' }).success).toBe(false);
  });

  it('rejects a malformed periodStart', () => {
    expect(submitFactorSchema.safeParse({ ...valid, periodStart: '01-04-2026' }).success).toBe(false);
  });
});

describe('assessmentHistoryQuerySchema', () => {
  it('coerces limit and applies the default of 10', () => {
    expect(assessmentHistoryQuerySchema.parse({}).limit).toBe(10);
    expect(assessmentHistoryQuerySchema.parse({ limit: '5' }).limit).toBe(5);
  });
  it('rejects limit > 100', () => {
    expect(assessmentHistoryQuerySchema.safeParse({ limit: 200 }).success).toBe(false);
  });
});

describe('factorListQuerySchema', () => {
  it('accepts a category filter', () => {
    expect(factorListQuerySchema.safeParse({ category: 'set_schedule' }).success).toBe(true);
  });
  it('rejects an unknown source', () => {
    expect(factorListQuerySchema.safeParse({ source: 'guess' }).success).toBe(false);
  });
});

describe('notificationListQuerySchema', () => {
  it('accepts the empty query and applies defaults', () => {
    const r = notificationListQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(20);
  });
  it('rejects non-numeric page', () => {
    expect(notificationListQuerySchema.safeParse({ page: 'abc' }).success).toBe(false);
  });
});

describe('initiateOffboardingSchema', () => {
  it('accepts a known reason and YYYY-MM-DD effectiveDate', () => {
    expect(
      initiateOffboardingSchema.safeParse({
        reason: 'project_completed',
        effectiveDate: '2026-06-01',
      }).success,
    ).toBe(true);
  });
  it('rejects an unknown reason', () => {
    expect(
      initiateOffboardingSchema.safeParse({
        reason: 'meh',
        effectiveDate: '2026-06-01',
      }).success,
    ).toBe(false);
  });
});

describe('updateOffboardingSchema', () => {
  it('accepts each of the 5 statuses', () => {
    for (const status of ['initiated', 'in_progress', 'pending_final_invoice', 'completed', 'cancelled']) {
      expect(updateOffboardingSchema.safeParse({ status }).success).toBe(true);
    }
  });
  it('rejects an unknown status', () => {
    expect(updateOffboardingSchema.safeParse({ status: 'archived' }).success).toBe(false);
  });
});

describe('updateChecklistItemSchema', () => {
  it('accepts each of the 4 checklist statuses', () => {
    for (const status of ['pending', 'completed', 'skipped', 'not_applicable']) {
      expect(updateChecklistItemSchema.safeParse({ status }).success).toBe(true);
    }
  });
  it('rejects an unknown status', () => {
    expect(updateChecklistItemSchema.safeParse({ status: 'foo' }).success).toBe(false);
  });
});

describe('offboardingListQuerySchema', () => {
  it('coerces and defaults page + limit', () => {
    const r = offboardingListQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(20);
  });
  it('rejects an unknown status filter', () => {
    expect(offboardingListQuerySchema.safeParse({ status: 'bad' }).success).toBe(false);
  });
});

describe('completeOnboardingStepSchema', () => {
  it('accepts the completed status with empty data', () => {
    expect(
      completeOnboardingStepSchema.safeParse({ status: 'completed' }).success,
    ).toBe(true);
  });

  it('rejects a status that is not completed or skipped', () => {
    expect(
      completeOnboardingStepSchema.safeParse({ status: 'pending' }).success,
    ).toBe(false);
  });
});

describe('updateOrganizationSettingsSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    expect(updateOrganizationSettingsSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial settings update', () => {
    expect(
      updateOrganizationSettingsSchema.safeParse({
        name: 'Updated Org Name',
      }).success,
    ).toBe(true);
  });
});
