import { z } from 'zod';
import { StepStatus } from '../constants/state-machines';

export const completeOnboardingStepSchema = z.object({
  status: z.enum([StepStatus.COMPLETED, StepStatus.SKIPPED]),
  data: z.record(z.unknown()).optional().default({}),
});

export type CompleteOnboardingStepInput = z.infer<typeof completeOnboardingStepSchema>;
