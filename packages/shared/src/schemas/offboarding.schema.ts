import { z } from 'zod';
import {
  OffboardingStatus,
  OffboardingReason,
  ChecklistStatus,
} from '../constants/state-machines';

export const initiateOffboardingSchema = z.object({
  reason: z.enum([
    OffboardingReason.PROJECT_COMPLETED,
    OffboardingReason.BUDGET_CUT,
    OffboardingReason.PERFORMANCE,
    OffboardingReason.MUTUAL_AGREEMENT,
    OffboardingReason.COMPLIANCE_RISK,
    OffboardingReason.OTHER,
  ]),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  notes: z.string().max(2000).optional(),
});

export type InitiateOffboardingInput = z.infer<typeof initiateOffboardingSchema>;

export const updateOffboardingSchema = z.object({
  status: z.enum([
    OffboardingStatus.INITIATED,
    OffboardingStatus.IN_PROGRESS,
    OffboardingStatus.PENDING_FINAL_INVOICE,
    OffboardingStatus.COMPLETED,
    OffboardingStatus.CANCELLED,
  ]),
  notes: z.string().max(2000).optional(),
});

export type UpdateOffboardingInput = z.infer<typeof updateOffboardingSchema>;

export const updateChecklistItemSchema = z.object({
  status: z.enum([
    ChecklistStatus.PENDING,
    ChecklistStatus.COMPLETED,
    ChecklistStatus.SKIPPED,
    ChecklistStatus.NOT_APPLICABLE,
  ]),
  notes: z.string().max(2000).optional(),
});

export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;

export const offboardingListQuerySchema = z.object({
  status: z
    .enum([
      OffboardingStatus.INITIATED,
      OffboardingStatus.IN_PROGRESS,
      OffboardingStatus.PENDING_FINAL_INVOICE,
      OffboardingStatus.COMPLETED,
      OffboardingStatus.CANCELLED,
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type OffboardingListQuery = z.infer<typeof offboardingListQuerySchema>;
