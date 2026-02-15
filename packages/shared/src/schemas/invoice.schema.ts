import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  timeEntryId: z.string().uuid().optional(),
});

export const createInvoiceSchema = z
  .object({
    engagementId: z.string().uuid('Invalid engagement ID'),
    invoiceNumber: z.string().min(1, 'Invoice number is required').max(50),
    periodStart: z.string().date('Invalid date format'),
    periodEnd: z.string().date('Invalid date format'),
    notes: z.string().max(2000).optional(),
    lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: 'Period end must be on or after period start',
    path: ['periodEnd'],
  });

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50).optional(),
  periodStart: z.string().date('Invalid date format').optional(),
  periodEnd: z.string().date('Invalid date format').optional(),
  notes: z.string().max(2000).nullable().optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const rejectInvoiceSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
});

export type RejectInvoiceInput = z.infer<typeof rejectInvoiceSchema>;

export const disputeInvoiceSchema = z.object({
  reason: z.string().min(1, 'Dispute reason is required').max(1000),
});

export type DisputeInvoiceInput = z.infer<typeof disputeInvoiceSchema>;

export const scheduleInvoiceSchema = z.object({
  paymentDate: z.string().date('Invalid date format'),
});

export type ScheduleInvoiceInput = z.infer<typeof scheduleInvoiceSchema>;

export const markPaidSchema = z.object({
  paidAt: z.string().datetime('Invalid datetime format'),
  referenceNumber: z.string().max(100).optional(),
});

export type MarkPaidInput = z.infer<typeof markPaidSchema>;

export const invoiceListQuerySchema = z.object({
  status: z.string().optional(),
  contractorId: z.string().uuid().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;
