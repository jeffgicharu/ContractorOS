import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EngagementsService } from './engagements.service';
import { EngagementsRepository } from './engagements.repository';
import { ContractorsRepository } from '../contractors/contractors.repository';
import { EngagementStatus, PaymentTerms, type Engagement } from '@contractor-os/shared';

const ORG_ID = 'org-1';
const CONTRACTOR_ID = 'contractor-1';
const ENGAGEMENT_ID = 'engagement-1';

const MOCK_CONTRACTOR_ACTIVE = {
  id: CONTRACTOR_ID,
  organization_id: ORG_ID,
  user_id: 'user-1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  status: 'active',
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
  activated_at: new Date().toISOString(),
  offboarded_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_CONTRACTOR_DRAFT = {
  ...MOCK_CONTRACTOR_ACTIVE,
  status: 'invite_sent',
  activated_at: null,
};

function makeEngagement(overrides: Partial<Engagement> = {}): Engagement {
  return {
    id: ENGAGEMENT_ID,
    contractorId: CONTRACTOR_ID,
    organizationId: ORG_ID,
    title: 'Test Engagement',
    description: null,
    startDate: '2025-01-01',
    endDate: null,
    hourlyRate: 100,
    fixedRate: null,
    currency: 'USD',
    paymentTerms: PaymentTerms.NET_30,
    status: EngagementStatus.DRAFT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockEngagementsRepo(): jest.Mocked<EngagementsRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByContractorId: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<EngagementsRepository>;
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

describe('EngagementsService', () => {
  let service: EngagementsService;
  let engagementsRepo: jest.Mocked<EngagementsRepository>;
  let contractorsRepo: jest.Mocked<ContractorsRepository>;

  beforeEach(() => {
    engagementsRepo = createMockEngagementsRepo();
    contractorsRepo = createMockContractorsRepo();
    service = new EngagementsService(engagementsRepo, contractorsRepo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const input = {
      title: 'New Engagement',
      startDate: '2025-01-01',
      hourlyRate: 150,
      currency: 'USD',
      paymentTerms: 'net_30' as const,
    };

    it('should create an engagement for an active contractor', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      engagementsRepo.create.mockResolvedValue(makeEngagement({ title: input.title }));

      const result = await service.create(ORG_ID, CONTRACTOR_ID, input);

      expect(result.title).toBe('New Engagement');
      expect(engagementsRepo.create).toHaveBeenCalledWith(ORG_ID, CONTRACTOR_ID, input);
    });

    it('should throw NotFoundException if contractor not found', async () => {
      contractorsRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(ORG_ID, 'unknown', input),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if contractor is not active', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_DRAFT);

      await expect(
        service.create(ORG_ID, CONTRACTOR_ID, input),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByContractor', () => {
    it('should return engagements for an existing contractor', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      const engagements = [makeEngagement(), makeEngagement({ id: 'engagement-2' })];
      engagementsRepo.findByContractorId.mockResolvedValue(engagements);

      const result = await service.findByContractor(ORG_ID, CONTRACTOR_ID);

      expect(result).toHaveLength(2);
      expect(engagementsRepo.findByContractorId).toHaveBeenCalledWith(ORG_ID, CONTRACTOR_ID);
    });

    it('should throw NotFoundException if contractor not found', async () => {
      contractorsRepo.findById.mockResolvedValue(null);

      await expect(
        service.findByContractor(ORG_ID, 'unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return an engagement by id', async () => {
      engagementsRepo.findById.mockResolvedValue(makeEngagement());

      const result = await service.findById(ORG_ID, ENGAGEMENT_ID);

      expect(result.id).toBe(ENGAGEMENT_ID);
    });

    it('should throw NotFoundException if engagement not found', async () => {
      engagementsRepo.findById.mockResolvedValue(null);

      await expect(
        service.findById(ORG_ID, 'unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if engagement belongs to different org', async () => {
      engagementsRepo.findById.mockResolvedValue(makeEngagement({ organizationId: 'other-org' }));

      await expect(
        service.findById(ORG_ID, ENGAGEMENT_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a draft engagement', async () => {
      const engagement = makeEngagement({ status: EngagementStatus.DRAFT });
      engagementsRepo.findById.mockResolvedValue(engagement);
      engagementsRepo.update.mockResolvedValue({ ...engagement, title: 'Updated' });

      const result = await service.update(ORG_ID, ENGAGEMENT_ID, { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('should update an active engagement', async () => {
      const engagement = makeEngagement({ status: EngagementStatus.ACTIVE });
      engagementsRepo.findById.mockResolvedValue(engagement);
      engagementsRepo.update.mockResolvedValue({ ...engagement, title: 'Updated' });

      const result = await service.update(ORG_ID, ENGAGEMENT_ID, { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('should throw BadRequestException for completed engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.COMPLETED }),
      );

      await expect(
        service.update(ORG_ID, ENGAGEMENT_ID, { title: 'Updated' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for cancelled engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.CANCELLED }),
      );

      await expect(
        service.update(ORG_ID, ENGAGEMENT_ID, { title: 'Updated' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for unknown engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(null);

      await expect(
        service.update(ORG_ID, 'unknown', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('transitionStatus', () => {
    it('should transition draft → active', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.DRAFT }),
      );

      await service.transitionStatus(ORG_ID, ENGAGEMENT_ID, EngagementStatus.ACTIVE);

      expect(engagementsRepo.updateStatus).toHaveBeenCalledWith(ENGAGEMENT_ID, EngagementStatus.ACTIVE);
    });

    it('should transition active → paused', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.ACTIVE }),
      );

      await service.transitionStatus(ORG_ID, ENGAGEMENT_ID, EngagementStatus.PAUSED);

      expect(engagementsRepo.updateStatus).toHaveBeenCalledWith(ENGAGEMENT_ID, EngagementStatus.PAUSED);
    });

    it('should transition active → completed', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.ACTIVE }),
      );

      await service.transitionStatus(ORG_ID, ENGAGEMENT_ID, EngagementStatus.COMPLETED);

      expect(engagementsRepo.updateStatus).toHaveBeenCalledWith(ENGAGEMENT_ID, EngagementStatus.COMPLETED);
    });

    it('should transition paused → active', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.PAUSED }),
      );

      await service.transitionStatus(ORG_ID, ENGAGEMENT_ID, EngagementStatus.ACTIVE);

      expect(engagementsRepo.updateStatus).toHaveBeenCalledWith(ENGAGEMENT_ID, EngagementStatus.ACTIVE);
    });

    it('should reject invalid transition: draft → completed', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.DRAFT }),
      );

      await expect(
        service.transitionStatus(ORG_ID, ENGAGEMENT_ID, EngagementStatus.COMPLETED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transition from terminal status: completed → active', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.COMPLETED }),
      );

      await expect(
        service.transitionStatus(ORG_ID, ENGAGEMENT_ID, EngagementStatus.ACTIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for unknown engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(null);

      await expect(
        service.transitionStatus(ORG_ID, 'unknown', EngagementStatus.ACTIVE),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
