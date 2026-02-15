import { z } from 'zod';
import { ContractorType } from '../constants/state-machines';

export const createContractorSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  type: z.enum([ContractorType.DOMESTIC, ContractorType.FOREIGN]),
  engagementTitle: z.string().max(255).optional(),
  engagementStartDate: z.string().date('Invalid date format').optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
});

export type CreateContractorInput = z.infer<typeof createContractorSchema>;

export const updateContractorSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).nullable().optional(),
  addressLine1: z.string().max(255).nullable().optional(),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  zipCode: z.string().max(20).nullable().optional(),
  country: z.string().max(100).optional(),
});

export type UpdateContractorInput = z.infer<typeof updateContractorSchema>;

export const bulkInviteSchema = z.object({
  contractors: z
    .array(
      z.object({
        email: z.string().email('Invalid email address'),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        type: z.enum([ContractorType.DOMESTIC, ContractorType.FOREIGN]),
      }),
    )
    .min(1, 'At least one contractor is required')
    .max(50, 'Maximum 50 contractors per bulk invite'),
});

export type BulkInviteInput = z.infer<typeof bulkInviteSchema>;

export const contractorListQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['created_at', 'first_name', 'last_name', 'status', 'email']).default('created_at'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type ContractorListQuery = z.infer<typeof contractorListQuerySchema>;
