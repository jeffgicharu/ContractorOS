import { z } from 'zod';
import { TaxDocumentType } from '../constants/document-types';

export const uploadDocumentSchema = z.object({
  type: z.enum([
    TaxDocumentType.W9,
    TaxDocumentType.W8BEN,
    TaxDocumentType.CONTRACT,
    TaxDocumentType.NDA,
    TaxDocumentType.INSURANCE_CERTIFICATE,
    TaxDocumentType.OTHER,
  ]),
  expiresAt: z.string().datetime('Invalid datetime format').optional(),
  notes: z.string().max(1000).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentListQuerySchema = z.object({
  type: z
    .enum([
      TaxDocumentType.W9,
      TaxDocumentType.W8BEN,
      TaxDocumentType.CONTRACT,
      TaxDocumentType.NDA,
      TaxDocumentType.INSURANCE_CERTIFICATE,
      TaxDocumentType.OTHER,
    ])
    .optional(),
  isCurrent: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
