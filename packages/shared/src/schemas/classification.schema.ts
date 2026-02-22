import { z } from 'zod';
import { FactorCategory, FactorSource } from '../constants/classification-factors';

export const submitFactorSchema = z.object({
  category: z.enum([
    FactorCategory.HOURS_PER_WEEK,
    FactorCategory.ENGAGEMENT_DURATION_WEEKS,
    FactorCategory.EXCLUSIVITY_RATIO,
    FactorCategory.SET_SCHEDULE,
    FactorCategory.TOOLS_PROVIDED,
    FactorCategory.TRAINING_PROVIDED,
    FactorCategory.SUPERVISION_LEVEL,
    FactorCategory.INTEGRATION_LEVEL,
    FactorCategory.MULTIPLE_CLIENTS,
    FactorCategory.PROFIT_LOSS_OPPORTUNITY,
    FactorCategory.SIGNIFICANT_INVESTMENT,
  ]),
  numericValue: z.number().optional(),
  booleanValue: z.boolean().optional(),
  textValue: z.string().max(255).optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export type SubmitFactorInput = z.infer<typeof submitFactorSchema>;

export const assessmentHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type AssessmentHistoryQuery = z.infer<typeof assessmentHistoryQuerySchema>;

export const factorListQuerySchema = z.object({
  category: z
    .enum([
      FactorCategory.HOURS_PER_WEEK,
      FactorCategory.ENGAGEMENT_DURATION_WEEKS,
      FactorCategory.EXCLUSIVITY_RATIO,
      FactorCategory.SET_SCHEDULE,
      FactorCategory.TOOLS_PROVIDED,
      FactorCategory.TRAINING_PROVIDED,
      FactorCategory.SUPERVISION_LEVEL,
      FactorCategory.INTEGRATION_LEVEL,
      FactorCategory.MULTIPLE_CLIENTS,
      FactorCategory.PROFIT_LOSS_OPPORTUNITY,
      FactorCategory.SIGNIFICANT_INVESTMENT,
    ])
    .optional(),
  source: z.enum([FactorSource.COMPUTED, FactorSource.MANUAL, FactorSource.TIME_ENTRY]).optional(),
});

export type FactorListQuery = z.infer<typeof factorListQuerySchema>;
