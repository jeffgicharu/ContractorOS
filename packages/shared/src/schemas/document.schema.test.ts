import { describe, it, expect } from 'vitest';
import { uploadDocumentSchema, documentListQuerySchema } from './document.schema';

describe('uploadDocumentSchema', () => {
  it('accepts each of the supported tax-document types', () => {
    for (const type of ['w9', 'w8ben', 'contract', 'nda', 'insurance_certificate', 'other']) {
      expect(uploadDocumentSchema.safeParse({ type }).success).toBe(true);
    }
  });

  it('rejects an unknown document type', () => {
    expect(uploadDocumentSchema.safeParse({ type: 'passport' }).success).toBe(false);
  });

  it('accepts an optional ISO datetime expiresAt', () => {
    expect(
      uploadDocumentSchema.safeParse({ type: 'w9', expiresAt: '2027-01-01T00:00:00.000Z' }).success,
    ).toBe(true);
  });

  it('rejects a malformed expiresAt', () => {
    expect(
      uploadDocumentSchema.safeParse({ type: 'w9', expiresAt: '2027-01-01' }).success,
    ).toBe(false);
  });
});

describe('documentListQuerySchema', () => {
  it('coerces isCurrent="true" into a boolean true', () => {
    const r = documentListQuerySchema.parse({ isCurrent: 'true' });
    expect(r.isCurrent).toBe(true);
  });

  it('coerces isCurrent="false" into a boolean false', () => {
    const r = documentListQuerySchema.parse({ isCurrent: 'false' });
    expect(r.isCurrent).toBe(false);
  });
});
