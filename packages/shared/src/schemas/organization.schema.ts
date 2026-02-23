import { z } from 'zod';

export const updateOrganizationSettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  defaultPaymentTerms: z
    .enum(['net_15', 'net_30', 'net_45', 'net_60'])
    .optional(),
  defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).optional(),
  reminderDays: z
    .array(z.number().int().min(1).max(90))
    .max(10)
    .optional(),
});

export type UpdateOrganizationSettings = z.infer<
  typeof updateOrganizationSettingsSchema
>;
