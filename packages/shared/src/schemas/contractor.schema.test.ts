import { describe, it, expect } from 'vitest';
import {
  createContractorSchema,
  updateContractorSchema,
  bulkInviteSchema,
  contractorListQuerySchema,
} from './contractor.schema';

describe('createContractorSchema', () => {
  const valid = {
    email: 'casey@example.test',
    firstName: 'Casey',
    lastName: 'Contractor',
    type: 'domestic' as const,
  };

  it('accepts the minimum valid payload', () => {
    expect(createContractorSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a non-email value in email', () => {
    expect(
      createContractorSchema.safeParse({ ...valid, email: 'not-an-email' }).success,
    ).toBe(false);
  });

  it('rejects an unknown contractor type', () => {
    expect(
      createContractorSchema.safeParse({ ...valid, type: 'employee' }).success,
    ).toBe(false);
  });

  it('rejects a non-positive hourlyRate', () => {
    expect(
      createContractorSchema.safeParse({ ...valid, hourlyRate: 0 }).success,
    ).toBe(false);
  });
});

describe('updateContractorSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    expect(updateContractorSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update with one nullable field', () => {
    expect(updateContractorSchema.safeParse({ phone: null }).success).toBe(true);
  });

  it('rejects firstName longer than 100 chars', () => {
    expect(
      updateContractorSchema.safeParse({ firstName: 'x'.repeat(101) }).success,
    ).toBe(false);
  });
});

describe('bulkInviteSchema', () => {
  const oneContractor = {
    email: 'a@x.test',
    firstName: 'A',
    lastName: 'B',
    type: 'domestic' as const,
  };

  it('accepts 1..50 contractors', () => {
    expect(bulkInviteSchema.safeParse({ contractors: [oneContractor] }).success).toBe(true);
    expect(
      bulkInviteSchema.safeParse({ contractors: Array(50).fill(oneContractor) }).success,
    ).toBe(true);
  });

  it('rejects 0 contractors', () => {
    expect(bulkInviteSchema.safeParse({ contractors: [] }).success).toBe(false);
  });

  it('rejects 51 contractors', () => {
    expect(
      bulkInviteSchema.safeParse({ contractors: Array(51).fill(oneContractor) }).success,
    ).toBe(false);
  });
});

describe('contractorListQuerySchema', () => {
  it('coerces string page numbers and applies defaults', () => {
    const result = contractorListQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.sortBy).toBe('created_at');
    expect(result.sortDir).toBe('desc');
  });

  it('rejects an unknown sortBy value', () => {
    expect(
      contractorListQuerySchema.safeParse({ sortBy: 'phone' }).success,
    ).toBe(false);
  });
});
