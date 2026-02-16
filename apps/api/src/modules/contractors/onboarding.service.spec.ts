import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { ContractorsRepository } from './contractors.repository';
import {
  OnboardingStepType,
  StepStatus,
  ContractorStatus,
} from '@contractor-os/shared';

const ORG_ID = 'org-1';
const CONTRACTOR_ID = 'contractor-1';
const USER_ID = 'user-1';

const MOCK_CONTRACTOR = {
  id: CONTRACTOR_ID,
  organization_id: ORG_ID,
  user_id: USER_ID,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  status: 'tax_form_pending',
  type: 'domestic',
  invite_token: null,
  invite_expires_at: null,
  phone: null,
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  zip_code: null,
  country: 'US',
  tin_last_four: null,
  bank_name: null,
  bank_routing: null,
  bank_account_last_four: null,
  bank_verified: false,
  activated_at: null,
  offboarded_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function makeSteps(completedCount: number) {
  const types = [
    OnboardingStepType.INVITE_ACCEPTED,
    OnboardingStepType.TAX_FORM_SUBMITTED,
    OnboardingStepType.CONTRACT_SIGNED,
    OnboardingStepType.BANK_DETAILS_SUBMITTED,
  ];
  return types.map((stepType, i) => ({
    id: `step-${i + 1}`,
    contractorId: CONTRACTOR_ID,
    stepType,
    status: i < completedCount ? StepStatus.COMPLETED : StepStatus.PENDING,
    completedAt: i < completedCount ? new Date().toISOString() : null,
    data: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

function createMockOnboardingRepo(): jest.Mocked<OnboardingRepository> {
  return {
    createSteps: jest.fn(),
    findByContractorId: jest.fn(),
    findStep: jest.fn(),
    completeStep: jest.fn(),
  } as unknown as jest.Mocked<OnboardingRepository>;
}

function createMockContractorsRepo(): jest.Mocked<ContractorsRepository> {
  return {
    findById: jest.fn(),
    updateStatus: jest.fn(),
    create: jest.fn(),
    findList: jest.fn(),
    findDetailById: jest.fn(),
    update: jest.fn(),
    updateInviteToken: jest.fn(),
    existsByEmail: jest.fn(),
  } as unknown as jest.Mocked<ContractorsRepository>;
}

describe('OnboardingService', () => {
  let service: OnboardingService;
  let onboardingRepo: jest.Mocked<OnboardingRepository>;
  let contractorsRepo: jest.Mocked<ContractorsRepository>;

  beforeEach(() => {
    onboardingRepo = createMockOnboardingRepo();
    contractorsRepo = createMockContractorsRepo();
    service = new OnboardingService(onboardingRepo, contractorsRepo);
    jest.clearAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('should return all steps for an existing contractor', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      const steps = makeSteps(1);
      onboardingRepo.findByContractorId.mockResolvedValue(steps);

      const result = await service.getOnboardingStatus(ORG_ID, CONTRACTOR_ID);

      expect(result.completedSteps).toBe(1);
      expect(result.totalSteps).toBe(4);
      expect(result.steps).toHaveLength(4);
      expect(contractorsRepo.findById).toHaveBeenCalledWith(ORG_ID, CONTRACTOR_ID);
    });

    it('should throw NotFoundException for unknown contractor', async () => {
      contractorsRepo.findById.mockResolvedValue(null);

      await expect(
        service.getOnboardingStatus(ORG_ID, 'unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeStep', () => {
    it('should complete invite_accepted step', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      const steps = makeSteps(0);
      onboardingRepo.findByContractorId.mockResolvedValue(steps);
      const completedStep = { ...steps[0]!, status: StepStatus.COMPLETED, completedAt: new Date().toISOString() };
      onboardingRepo.completeStep.mockResolvedValue(completedStep);
      contractorsRepo.updateStatus.mockResolvedValue(undefined);

      const result = await service.completeStep(
        ORG_ID, CONTRACTOR_ID, OnboardingStepType.INVITE_ACCEPTED,
        { status: StepStatus.COMPLETED, data: {} },
        USER_ID,
      );

      expect(result.status).toBe(StepStatus.COMPLETED);
      expect(onboardingRepo.completeStep).toHaveBeenCalledWith(
        CONTRACTOR_ID, OnboardingStepType.INVITE_ACCEPTED, StepStatus.COMPLETED, {},
      );
    });

    it('should auto-advance contractor status to tax_form_pending after invite_accepted', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(0));
      onboardingRepo.completeStep.mockResolvedValue({
        ...makeSteps(0)[0]!, status: StepStatus.COMPLETED,
      });
      contractorsRepo.updateStatus.mockResolvedValue(undefined);

      await service.completeStep(
        ORG_ID, CONTRACTOR_ID, OnboardingStepType.INVITE_ACCEPTED,
        { status: StepStatus.COMPLETED, data: {} },
        USER_ID,
      );

      expect(contractorsRepo.updateStatus).toHaveBeenCalledWith(
        CONTRACTOR_ID, ContractorStatus.TAX_FORM_PENDING, USER_ID,
      );
    });

    it('should auto-advance contractor status to contract_pending after tax_form_submitted', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(1));
      onboardingRepo.completeStep.mockResolvedValue({
        ...makeSteps(1)[1]!, status: StepStatus.COMPLETED,
      });
      contractorsRepo.updateStatus.mockResolvedValue(undefined);

      await service.completeStep(
        ORG_ID, CONTRACTOR_ID, OnboardingStepType.TAX_FORM_SUBMITTED,
        { status: StepStatus.COMPLETED, data: {} },
        USER_ID,
      );

      expect(contractorsRepo.updateStatus).toHaveBeenCalledWith(
        CONTRACTOR_ID, ContractorStatus.CONTRACT_PENDING, USER_ID,
      );
    });

    it('should auto-advance contractor status to bank_details_pending after contract_signed', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(2));
      onboardingRepo.completeStep.mockResolvedValue({
        ...makeSteps(2)[2]!, status: StepStatus.COMPLETED,
      });
      contractorsRepo.updateStatus.mockResolvedValue(undefined);

      await service.completeStep(
        ORG_ID, CONTRACTOR_ID, OnboardingStepType.CONTRACT_SIGNED,
        { status: StepStatus.COMPLETED, data: {} },
        USER_ID,
      );

      expect(contractorsRepo.updateStatus).toHaveBeenCalledWith(
        CONTRACTOR_ID, ContractorStatus.BANK_DETAILS_PENDING, USER_ID,
      );
    });

    it('should auto-advance contractor status to active after bank_details_submitted', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(3));
      onboardingRepo.completeStep.mockResolvedValue({
        ...makeSteps(3)[3]!, status: StepStatus.COMPLETED,
      });
      contractorsRepo.updateStatus.mockResolvedValue(undefined);

      await service.completeStep(
        ORG_ID, CONTRACTOR_ID, OnboardingStepType.BANK_DETAILS_SUBMITTED,
        { status: StepStatus.COMPLETED, data: {} },
        USER_ID,
      );

      expect(contractorsRepo.updateStatus).toHaveBeenCalledWith(
        CONTRACTOR_ID, ContractorStatus.ACTIVE, USER_ID,
      );
    });

    it('should not auto-advance when step is skipped', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(1));
      onboardingRepo.completeStep.mockResolvedValue({
        ...makeSteps(1)[1]!, status: StepStatus.SKIPPED,
      });

      await service.completeStep(
        ORG_ID, CONTRACTOR_ID, OnboardingStepType.TAX_FORM_SUBMITTED,
        { status: StepStatus.SKIPPED, data: {} },
        USER_ID,
      );

      expect(contractorsRepo.updateStatus).not.toHaveBeenCalled();
    });

    it('should reject out-of-order step completion', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(0));

      await expect(
        service.completeStep(
          ORG_ID, CONTRACTOR_ID, OnboardingStepType.TAX_FORM_SUBMITTED,
          { status: StepStatus.COMPLETED, data: {} },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject completing an already-completed step', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(1));

      await expect(
        service.completeStep(
          ORG_ID, CONTRACTOR_ID, OnboardingStepType.INVITE_ACCEPTED,
          { status: StepStatus.COMPLETED, data: {} },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for unknown contractor', async () => {
      contractorsRepo.findById.mockResolvedValue(null);

      await expect(
        service.completeStep(
          ORG_ID, 'unknown', OnboardingStepType.INVITE_ACCEPTED,
          { status: StepStatus.COMPLETED, data: {} },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid step type', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);

      await expect(
        service.completeStep(
          ORG_ID, CONTRACTOR_ID, 'invalid_step_type',
          { status: StepStatus.COMPLETED, data: {} },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should store submitted data in step data field', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(1));
      const inputData = { tinLastFour: '1234', formType: 'w9' };
      onboardingRepo.completeStep.mockResolvedValue({
        ...makeSteps(1)[1]!, status: StepStatus.COMPLETED, data: inputData,
      });
      contractorsRepo.updateStatus.mockResolvedValue(undefined);

      await service.completeStep(
        ORG_ID, CONTRACTOR_ID, OnboardingStepType.TAX_FORM_SUBMITTED,
        { status: StepStatus.COMPLETED, data: inputData },
        USER_ID,
      );

      expect(onboardingRepo.completeStep).toHaveBeenCalledWith(
        CONTRACTOR_ID, OnboardingStepType.TAX_FORM_SUBMITTED, StepStatus.COMPLETED, inputData,
      );
    });

    it('should reject skipping a step out of order', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR);
      onboardingRepo.findByContractorId.mockResolvedValue(makeSteps(0));

      await expect(
        service.completeStep(
          ORG_ID, CONTRACTOR_ID, OnboardingStepType.CONTRACT_SIGNED,
          { status: StepStatus.COMPLETED, data: {} },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
