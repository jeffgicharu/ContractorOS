import {
  initiateOffboardingSchema,
  updateOffboardingSchema,
  updateChecklistItemSchema,
  offboardingListQuerySchema,
} from '@contractor-os/shared';

describe('offboarding schemas', () => {
  // ──────────────────────────────────────────────────────────
  // initiateOffboardingSchema
  // ──────────────────────────────────────────────────────────

  describe('initiateOffboardingSchema', () => {
    it('accepts valid input with all fields', () => {
      const result = initiateOffboardingSchema.safeParse({
        reason: 'project_completed',
        effectiveDate: '2026-03-15',
        notes: 'Some notes',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid input without optional notes', () => {
      const result = initiateOffboardingSchema.safeParse({
        reason: 'budget_cut',
        effectiveDate: '2026-06-01',
      });
      expect(result.success).toBe(true);
    });

    it('accepts all valid reason values', () => {
      const reasons = [
        'project_completed', 'budget_cut', 'performance',
        'mutual_agreement', 'compliance_risk', 'other',
      ];
      for (const reason of reasons) {
        const result = initiateOffboardingSchema.safeParse({
          reason,
          effectiveDate: '2026-01-01',
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid reason', () => {
      const result = initiateOffboardingSchema.safeParse({
        reason: 'invalid_reason',
        effectiveDate: '2026-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing reason', () => {
      const result = initiateOffboardingSchema.safeParse({
        effectiveDate: '2026-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing effectiveDate', () => {
      const result = initiateOffboardingSchema.safeParse({
        reason: 'project_completed',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = initiateOffboardingSchema.safeParse({
        reason: 'project_completed',
        effectiveDate: '03/15/2026',
      });
      expect(result.success).toBe(false);
    });

    it('rejects notes exceeding 2000 characters', () => {
      const result = initiateOffboardingSchema.safeParse({
        reason: 'other',
        effectiveDate: '2026-01-01',
        notes: 'x'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty body', () => {
      const result = initiateOffboardingSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // updateOffboardingSchema
  // ──────────────────────────────────────────────────────────

  describe('updateOffboardingSchema', () => {
    it('accepts valid status', () => {
      const result = updateOffboardingSchema.safeParse({ status: 'in_progress' });
      expect(result.success).toBe(true);
    });

    it('accepts all valid status values', () => {
      const statuses = [
        'initiated', 'in_progress', 'pending_final_invoice', 'completed', 'cancelled',
      ];
      for (const status of statuses) {
        const result = updateOffboardingSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('accepts status with notes', () => {
      const result = updateOffboardingSchema.safeParse({
        status: 'completed',
        notes: 'All done',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = updateOffboardingSchema.safeParse({ status: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('rejects missing status', () => {
      const result = updateOffboardingSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // updateChecklistItemSchema
  // ──────────────────────────────────────────────────────────

  describe('updateChecklistItemSchema', () => {
    it('accepts valid status', () => {
      const result = updateChecklistItemSchema.safeParse({ status: 'completed' });
      expect(result.success).toBe(true);
    });

    it('accepts all valid status values', () => {
      const statuses = ['pending', 'completed', 'skipped', 'not_applicable'];
      for (const status of statuses) {
        const result = updateChecklistItemSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('accepts status with notes', () => {
      const result = updateChecklistItemSchema.safeParse({
        status: 'completed',
        notes: 'Verified by IT',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = updateChecklistItemSchema.safeParse({ status: 'done' });
      expect(result.success).toBe(false);
    });

    it('rejects missing status', () => {
      const result = updateChecklistItemSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // offboardingListQuerySchema
  // ──────────────────────────────────────────────────────────

  describe('offboardingListQuerySchema', () => {
    it('accepts empty query (uses defaults)', () => {
      const result = offboardingListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ page: 1, limit: 20 });
    });

    it('accepts status filter', () => {
      const result = offboardingListQuerySchema.safeParse({ status: 'in_progress' });
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_progress');
    });

    it('accepts page and limit', () => {
      const result = offboardingListQuerySchema.safeParse({ page: '2', limit: '10' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ page: 2, limit: 10 });
    });

    it('coerces string page to number', () => {
      const result = offboardingListQuerySchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      expect(result.data!.page).toBe(3);
    });

    it('rejects limit over 100', () => {
      const result = offboardingListQuerySchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = offboardingListQuerySchema.safeParse({ status: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('rejects page 0', () => {
      const result = offboardingListQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects negative limit', () => {
      const result = offboardingListQuerySchema.safeParse({ limit: -1 });
      expect(result.success).toBe(false);
    });
  });
});
