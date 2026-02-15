export const TaxDocumentType = {
  W9: 'w9',
  W8BEN: 'w8ben',
  CONTRACT: 'contract',
  NDA: 'nda',
  INSURANCE_CERTIFICATE: 'insurance_certificate',
  OTHER: 'other',
} as const;

export type TaxDocumentType = (typeof TaxDocumentType)[keyof typeof TaxDocumentType];

export const REQUIRED_DOCUMENTS_DOMESTIC: readonly TaxDocumentType[] = [
  TaxDocumentType.W9,
  TaxDocumentType.CONTRACT,
];

export const REQUIRED_DOCUMENTS_FOREIGN: readonly TaxDocumentType[] = [
  TaxDocumentType.W8BEN,
  TaxDocumentType.CONTRACT,
];

export const DOCUMENT_TYPE_LABELS: Record<TaxDocumentType, string> = {
  [TaxDocumentType.W9]: 'W-9',
  [TaxDocumentType.W8BEN]: 'W-8BEN',
  [TaxDocumentType.CONTRACT]: 'Contract',
  [TaxDocumentType.NDA]: 'NDA',
  [TaxDocumentType.INSURANCE_CERTIFICATE]: 'Insurance Certificate',
  [TaxDocumentType.OTHER]: 'Other',
};

// 1099 reporting threshold (USD)
export const IRS_1099_THRESHOLD = 600;

// Foreign contractor withholding rate when W-8BEN is missing
export const FOREIGN_WITHHOLDING_RATE = 0.3;
