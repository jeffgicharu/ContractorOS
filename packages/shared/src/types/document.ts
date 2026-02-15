import type { TaxDocumentType } from '../constants/document-types';

export interface TaxDocument {
  id: string;
  contractorId: string;
  organizationId: string;
  documentType: TaxDocumentType;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  expiresAt: string | null;
  tinLastFour: string | null;
  isCurrent: boolean;
  version: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceReportEntry {
  contractorId: string;
  contractorName: string;
  contractorType: string;
  requiredDocuments: TaxDocumentType[];
  currentDocuments: TaxDocumentType[];
  missingDocuments: TaxDocumentType[];
  expiringDocuments: { type: TaxDocumentType; expiresAt: string }[];
  isCompliant: boolean;
}

export interface ReadinessEntry1099 {
  contractorId: string;
  contractorName: string;
  ytdPayments: number;
  hasCurrentW9: boolean;
  w9ExpiresAt: string | null;
  requires1099: boolean;
  isReady: boolean;
}
