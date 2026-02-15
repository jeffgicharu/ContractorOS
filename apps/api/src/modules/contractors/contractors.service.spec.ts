import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { ContractorsRepository } from './contractors.repository';

const ORG_ID = 'org-1';
const USER_ID = 'user-1';

const MOCK_CONTRACTOR_ROW = {
  id: 'contractor-1',
  organization_id: ORG_ID,
  user_id: null,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'Contractor',
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
  activated_at: null,
  offboarded_at: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

function createMockRepo(): jest.Mocked<ContractorsRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findList: jest.fn(),
    findDetailById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    updateInviteToken: jest.fn(),
    existsByEmail: jest.fn(),
  } as unknown as jest.Mocked<ContractorsRepository>;
}

describe('ContractorsService', () => {
  let service: ContractorsService;
  let repo: jest.Mocked<ContractorsRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    service = new ContractorsService(repo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a contractor and return id + email', async () => {
      repo.existsByEmail.mockResolvedValue(false);
      repo.create.mockResolvedValue({ ...MOCK_CONTRACTOR_ROW, email: 'new@example.com' });

      const result = await service.create(ORG_ID, {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Person',
        type: 'domestic',
      });

      expect(result.email).toBe('new@example.com');
      expect(result.id).toBe('contractor-1');
      expect(repo.create).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ email: 'new@example.com' }),
        expect.any(String), // invite token
        expect.any(Date), // invite expires
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      repo.existsByEmail.mockResolvedValue(true);

      await expect(
        service.create(ORG_ID, {
          email: 'existing@example.com',
          firstName: 'A',
          lastName: 'B',
          type: 'domestic',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('list', () => {
    it('should return items and pagination meta', async () => {
      repo.findList.mockResolvedValue({
        items: [
          {
            id: 'c-1',
            email: 'a@test.com',
            firstName: 'A',
            lastName: 'B',
            status: 'active' as const,
            type: 'domestic' as const,
            activatedAt: null,
            createdAt: '2025-01-01T00:00:00Z',
          },
        ],
        total: 1,
      });

      const result = await service.list(ORG_ID, {
        page: 1,
        pageSize: 20,
        sortBy: 'created_at',
        sortDir: 'desc',
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should pass query params through to repository', async () => {
      repo.findList.mockResolvedValue({ items: [], total: 0 });

      await service.list(ORG_ID, {
        page: 2,
        pageSize: 10,
        sortBy: 'first_name',
        sortDir: 'asc',
        status: 'active',
        search: 'john',
      });

      expect(repo.findList).toHaveBeenCalledWith(ORG_ID, {
        page: 2,
        pageSize: 10,
        sortBy: 'first_name',
        sortDir: 'asc',
        status: 'active',
        search: 'john',
      });
    });
  });

  describe('getDetail', () => {
    it('should return contractor detail when found', async () => {
      const mockDetail = {
        id: 'contractor-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Contractor',
        status: 'active' as const,
        type: 'domestic' as const,
        activatedAt: null,
        onboarding: { completedSteps: 0, totalSteps: 4, steps: [] },
        latestRiskAssessment: null,
        activeEngagements: 0,
        documentStatus: { hasCurrentW9: false, hasCurrentContract: false, expiringDocuments: 0 },
        ytdPayments: 0,
        createdAt: '2025-01-01T00:00:00Z',
      };

      repo.findDetailById.mockResolvedValue(mockDetail);

      const result = await service.getDetail(ORG_ID, 'contractor-1');
      expect(result.id).toBe('contractor-1');
    });

    it('should throw NotFoundException when contractor not found', async () => {
      repo.findDetailById.mockResolvedValue(null);

      await expect(service.getDetail(ORG_ID, 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update contractor and return id', async () => {
      repo.findById.mockResolvedValue(MOCK_CONTRACTOR_ROW);
      repo.update.mockResolvedValue(MOCK_CONTRACTOR_ROW);

      const result = await service.update(ORG_ID, 'contractor-1', {
        firstName: 'Updated',
      });

      expect(result.id).toBe('contractor-1');
      expect(repo.update).toHaveBeenCalledWith(ORG_ID, 'contractor-1', {
        firstName: 'Updated',
      });
    });

    it('should throw NotFoundException when contractor not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update(ORG_ID, 'bad-id', { firstName: 'A' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('transitionStatus', () => {
    it('should allow valid transition: active → suspended', async () => {
      repo.findById.mockResolvedValue({ ...MOCK_CONTRACTOR_ROW, status: 'active' });
      repo.updateStatus.mockResolvedValue(undefined);

      await service.transitionStatus(ORG_ID, 'contractor-1', 'suspended', USER_ID, 'Testing');

      expect(repo.updateStatus).toHaveBeenCalledWith(
        'contractor-1',
        'suspended',
        USER_ID,
        'Testing',
      );
    });

    it('should allow valid transition: active → offboarded', async () => {
      repo.findById.mockResolvedValue({ ...MOCK_CONTRACTOR_ROW, status: 'active' });
      repo.updateStatus.mockResolvedValue(undefined);

      await service.transitionStatus(ORG_ID, 'contractor-1', 'offboarded', USER_ID);

      expect(repo.updateStatus).toHaveBeenCalledWith(
        'contractor-1',
        'offboarded',
        USER_ID,
        undefined,
      );
    });

    it('should allow valid transition: suspended → active', async () => {
      repo.findById.mockResolvedValue({ ...MOCK_CONTRACTOR_ROW, status: 'suspended' });
      repo.updateStatus.mockResolvedValue(undefined);

      await service.transitionStatus(ORG_ID, 'contractor-1', 'active', USER_ID);

      expect(repo.updateStatus).toHaveBeenCalled();
    });

    it('should reject invalid transition: active → invite_sent', async () => {
      repo.findById.mockResolvedValue({ ...MOCK_CONTRACTOR_ROW, status: 'active' });

      await expect(
        service.transitionStatus(ORG_ID, 'contractor-1', 'invite_sent', USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid transition: offboarded → active', async () => {
      repo.findById.mockResolvedValue({ ...MOCK_CONTRACTOR_ROW, status: 'offboarded' });

      await expect(
        service.transitionStatus(ORG_ID, 'contractor-1', 'active', USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when contractor not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.transitionStatus(ORG_ID, 'bad-id', 'suspended', USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reinvite', () => {
    it('should reinvite a contractor in invite_sent status', async () => {
      repo.findById.mockResolvedValue({
        ...MOCK_CONTRACTOR_ROW,
        status: 'invite_sent',
      });
      repo.updateInviteToken.mockResolvedValue(undefined);

      await service.reinvite(ORG_ID, 'contractor-1');

      expect(repo.updateInviteToken).toHaveBeenCalledWith(
        'contractor-1',
        expect.any(String),
        expect.any(Date),
      );
    });

    it('should throw BadRequestException if not in invite_sent status', async () => {
      repo.findById.mockResolvedValue({ ...MOCK_CONTRACTOR_ROW, status: 'active' });

      await expect(service.reinvite(ORG_ID, 'contractor-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when contractor not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.reinvite(ORG_ID, 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkInvite', () => {
    it('should create contractors and track skipped duplicates', async () => {
      repo.existsByEmail
        .mockResolvedValueOnce(false) // first: new
        .mockResolvedValueOnce(true) // second: exists
        .mockResolvedValueOnce(false); // third: new

      repo.create.mockResolvedValue(MOCK_CONTRACTOR_ROW);

      const result = await service.bulkInvite(ORG_ID, {
        contractors: [
          { email: 'a@test.com', firstName: 'A', lastName: 'A', type: 'domestic' },
          { email: 'existing@test.com', firstName: 'B', lastName: 'B', type: 'domestic' },
          { email: 'c@test.com', firstName: 'C', lastName: 'C', type: 'foreign' },
        ],
      });

      expect(result.created).toBe(2);
      expect(result.skipped).toEqual(['existing@test.com']);
      expect(repo.create).toHaveBeenCalledTimes(2);
    });

    it('should return zero created when all are duplicates', async () => {
      repo.existsByEmail.mockResolvedValue(true);

      const result = await service.bulkInvite(ORG_ID, {
        contractors: [
          { email: 'a@test.com', firstName: 'A', lastName: 'A', type: 'domestic' },
        ],
      });

      expect(result.created).toBe(0);
      expect(result.skipped).toEqual(['a@test.com']);
    });
  });
});
