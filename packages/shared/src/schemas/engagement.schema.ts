import { z } from 'zod';
import { PaymentTerms, EngagementStatus } from '../constants/state-machines';

export const createEngagementSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().max(2000).optional(),
    startDate: z.string().date('Invalid date format'),
    endDate: z.string().date('Invalid date format').optional(),
    hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
    fixedRate: z.number().positive('Fixed rate must be positive').optional(),
    currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
    paymentTerms: z
      .enum([PaymentTerms.NET_15, PaymentTerms.NET_30, PaymentTerms.NET_45, PaymentTerms.NET_60])
      .default(PaymentTerms.NET_30),
  })
  .refine((data) => data.hourlyRate !== undefined || data.fixedRate !== undefined, {
    message: 'Either hourly rate or fixed rate is required',
    path: ['hourlyRate'],
  });

export type CreateEngagementInput = z.infer<typeof createEngagementSchema>;

export const updateEngagementSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  endDate: z.string().date('Invalid date format').nullable().optional(),
  hourlyRate: z.number().positive().nullable().optional(),
  fixedRate: z.number().positive().nullable().optional(),
  paymentTerms: z
    .enum([PaymentTerms.NET_15, PaymentTerms.NET_30, PaymentTerms.NET_45, PaymentTerms.NET_60])
    .optional(),
});

export type UpdateEngagementInput = z.infer<typeof updateEngagementSchema>;

export const updateEngagementStatusSchema = z.object({
  status: z.enum([
    EngagementStatus.DRAFT,
    EngagementStatus.ACTIVE,
    EngagementStatus.PAUSED,
    EngagementStatus.COMPLETED,
    EngagementStatus.CANCELLED,
  ]),
});

export type UpdateEngagementStatusInput = z.infer<typeof updateEngagementStatusSchema>;

export const createTimeEntrySchema = z.object({
  engagementId: z.string().uuid('Invalid engagement ID'),
  entryDate: z.string().date('Invalid date format'),
  hours: z
    .number()
    .positive('Hours must be positive')
    .max(24, 'Hours cannot exceed 24'),
  description: z.string().min(1, 'Description is required').max(1000),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;

export const updateTimeEntrySchema = z.object({
  entryDate: z.string().date('Invalid date format').optional(),
  hours: z.number().positive().max(24).optional(),
  description: z.string().min(1).max(1000).optional(),
});

export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;

export const timeEntryListQuerySchema = z.object({
  contractorId: z.string().uuid().optional(),
  engagementId: z.string().uuid().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type TimeEntryListQuery = z.infer<typeof timeEntryListQuerySchema>;
