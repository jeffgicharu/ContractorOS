import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type OnboardingStep,
  type CompleteOnboardingStepInput,
  OnboardingStepType,
  ContractorStatus,
  StepStatus,
} from '@contractor-os/shared';
import { OnboardingRepository } from './onboarding.repository';
import { ContractorsRepository } from './contractors.repository';

const STEP_ORDER: OnboardingStepType[] = [
  OnboardingStepType.INVITE_ACCEPTED,
  OnboardingStepType.TAX_FORM_SUBMITTED,
  OnboardingStepType.CONTRACT_SIGNED,
  OnboardingStepType.BANK_DETAILS_SUBMITTED,
];

const STEP_TO_NEXT_STATUS: Record<OnboardingStepType, ContractorStatus> = {
  [OnboardingStepType.INVITE_ACCEPTED]: ContractorStatus.TAX_FORM_PENDING,
  [OnboardingStepType.TAX_FORM_SUBMITTED]: ContractorStatus.CONTRACT_PENDING,
  [OnboardingStepType.CONTRACT_SIGNED]: ContractorStatus.BANK_DETAILS_PENDING,
  [OnboardingStepType.BANK_DETAILS_SUBMITTED]: ContractorStatus.ACTIVE,
};

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly onboardingRepo: OnboardingRepository,
    private readonly contractorsRepo: ContractorsRepository,
  ) {}

  async getOnboardingStatus(
    orgId: string,
    contractorId: string,
  ): Promise<{ completedSteps: number; totalSteps: number; steps: OnboardingStep[] }> {
    const contractor = await this.contractorsRepo.findById(orgId, contractorId);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${contractorId} not found`,
      });
    }

    const steps = await this.onboardingRepo.findByContractorId(contractorId);
    const completedSteps = steps.filter((s) => s.status === StepStatus.COMPLETED).length;

    return {
      completedSteps,
      totalSteps: STEP_ORDER.length,
      steps,
    };
  }

  async completeStep(
    orgId: string,
    contractorId: string,
    stepType: string,
    input: CompleteOnboardingStepInput,
    userId: string,
  ): Promise<OnboardingStep> {
    // Verify contractor exists in this org
    const contractor = await this.contractorsRepo.findById(orgId, contractorId);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${contractorId} not found`,
      });
    }

    // Validate step type
    const stepIndex = STEP_ORDER.indexOf(stepType as OnboardingStepType);
    if (stepIndex === -1) {
      throw new BadRequestException({
        code: 'INVALID_STEP',
        message: `Invalid onboarding step type: ${stepType}`,
      });
    }

    // Fetch all steps to check current state
    const steps = await this.onboardingRepo.findByContractorId(contractorId);
    const targetStep = steps.find((s) => s.stepType === stepType);

    if (!targetStep) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Onboarding step ${stepType} not found for contractor ${contractorId}`,
      });
    }

    if (targetStep.status !== StepStatus.PENDING) {
      throw new BadRequestException({
        code: 'STEP_NOT_PENDING',
        message: `Step ${stepType} is already ${targetStep.status}`,
      });
    }

    // Enforce sequential order: all preceding steps must be completed
    for (let i = 0; i < stepIndex; i++) {
      const precedingStep = steps.find((s) => s.stepType === STEP_ORDER[i]);
      if (!precedingStep || precedingStep.status !== StepStatus.COMPLETED) {
        throw new BadRequestException({
          code: 'OUT_OF_ORDER',
          message: `Cannot complete ${stepType} before ${STEP_ORDER[i]} is completed`,
        });
      }
    }

    // Complete the step
    const updatedStep = await this.onboardingRepo.completeStep(
      contractorId,
      stepType,
      input.status,
      input.data,
    );

    if (!updatedStep) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Failed to update step ${stepType}`,
      });
    }

    // Auto-advance contractor status if step was completed (not skipped)
    if (input.status === StepStatus.COMPLETED) {
      const nextStatus = STEP_TO_NEXT_STATUS[stepType as OnboardingStepType];
      if (nextStatus) {
        await this.contractorsRepo.updateStatus(contractorId, nextStatus, userId);
        this.logger.log(
          `Contractor ${contractorId}: onboarding step ${stepType} completed → status advanced to ${nextStatus}`,
        );
      }
    }

    return updatedStep;
  }
}
