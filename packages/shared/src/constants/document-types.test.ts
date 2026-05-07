import { describe, it, expect } from 'vitest';
import {
  TaxDocumentType,
  REQUIRED_DOCUMENTS_DOMESTIC,
  REQUIRED_DOCUMENTS_FOREIGN,
  DOCUMENT_TYPE_LABELS,
  IRS_1099_THRESHOLD,
  FOREIGN_WITHHOLDING_RATE,
} from './document-types';

describe('TaxDocumentType constants', () => {
  it('REQUIRED_DOCUMENTS_DOMESTIC requires W-9 and a contract', () => {
    expect(REQUIRED_DOCUMENTS_DOMESTIC).toEqual(
      expect.arrayContaining([TaxDocumentType.W9, TaxDocumentType.CONTRACT]),
    );
    expect(REQUIRED_DOCUMENTS_DOMESTIC).not.toContain(TaxDocumentType.W8BEN);
  });

  it('REQUIRED_DOCUMENTS_FOREIGN requires W-8BEN and a contract', () => {
    expect(REQUIRED_DOCUMENTS_FOREIGN).toEqual(
      expect.arrayContaining([TaxDocumentType.W8BEN, TaxDocumentType.CONTRACT]),
    );
    expect(REQUIRED_DOCUMENTS_FOREIGN).not.toContain(TaxDocumentType.W9);
  });

  it('DOCUMENT_TYPE_LABELS provides a label for every TaxDocumentType', () => {
    for (const type of Object.values(TaxDocumentType)) {
      expect(DOCUMENT_TYPE_LABELS[type]).toEqual(expect.any(String));
      expect(DOCUMENT_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });

  it('IRS 1099 threshold is the 2026 reporting trigger of $600', () => {
    expect(IRS_1099_THRESHOLD).toBe(600);
  });

  it('FOREIGN_WITHHOLDING_RATE is 30% per IRS Chapter 3', () => {
    expect(FOREIGN_WITHHOLDING_RATE).toBeCloseTo(0.3, 5);
  });
});
