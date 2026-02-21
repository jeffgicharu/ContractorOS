import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntriesRepository } from './time-entries.repository';
import { EngagementsRepository } from '../engagements/engagements.repository';
import { EngagementStatus, PaymentTerms, type Engagement } from '@contractor-os/shared';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

const CONTRACTOR_ID = 'contractor-1';
const OTHER_CONTRACTOR_ID = 'contractor-2';
const ENGAGEMENT_ID = 'engagement-1';
const ENTRY_ID = 'entry-1';
const ORG_ID = 'org-1';

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
    status: EngagementStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTimeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: ENTRY_ID,
    contractorId: CONTRACTOR_ID,
    engagementId: ENGAGEMENT_ID,
    entryDate: '2025-02-10',
    hours: 8,
    description: 'Test work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeUser(role: string, sub: string = CONTRACTOR_ID): JwtPayload {
  return { sub, orgId: ORG_ID, role };
}

function createMockTimeEntriesRepo(): jest.Mocked<TimeEntriesRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findList: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<TimeEntriesRepository>;
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

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;
  let timeEntriesRepo: jest.Mocked<TimeEntriesRepository>;
  let engagementsRepo: jest.Mocked<EngagementsRepository>;

  beforeEach(() => {
    timeEntriesRepo = createMockTimeEntriesRepo();
    engagementsRepo = createMockEngagementsRepo();
    service = new TimeEntriesService(timeEntriesRepo, engagementsRepo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const input = {
      engagementId: ENGAGEMENT_ID,
      entryDate: '2025-02-10',
      hours: 8,
      description: 'Test work',
    };

    it('should create a time entry for an active engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(makeEngagement());
      timeEntriesRepo.create.mockResolvedValue(makeTimeEntry());

      const result = await service.create(CONTRACTOR_ID, input);

      expect(result.id).toBe(ENTRY_ID);
      expect(timeEntriesRepo.create).toHaveBeenCalledWith(CONTRACTOR_ID, input);
    });

    it('should throw NotFoundException if engagement not found', async () => {
      engagementsRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(CONTRACTOR_ID, input),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if contractor does not own engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ contractorId: OTHER_CONTRACTOR_ID }),
      );

      await expect(
        service.create(CONTRACTOR_ID, input),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if engagement is not active', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.DRAFT }),
      );

      await expect(
        service.create(CONTRACTOR_ID, input),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for completed engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.COMPLETED }),
      );

      await expect(
        service.create(CONTRACTOR_ID, input),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findList', () => {
    const query = { page: 1, pageSize: 20 };

    it('should return all entries for admin', async () => {
      const entries = [makeTimeEntry(), makeTimeEntry({ id: 'entry-2' })];
      timeEntriesRepo.findList.mockResolvedValue({ items: entries, total: 2 });

      const result = await service.findList(query, makeUser('admin', 'admin-1'));

      expect(result.items).toHaveLength(2);
      expect(timeEntriesRepo.findList).toHaveBeenCalledWith(query, undefined);
    });

    it('should scope entries to own contractor ID for contractor role', async () => {
      timeEntriesRepo.findList.mockResolvedValue({ items: [makeTimeEntry()], total: 1 });

      await service.findList(query, makeUser('contractor'));

      expect(timeEntriesRepo.findList).toHaveBeenCalledWith(query, CONTRACTOR_ID);
    });
  });

  describe('findById', () => {
    it('should return a time entry', async () => {
      timeEntriesRepo.findById.mockResolvedValue(makeTimeEntry());

      const result = await service.findById(ENTRY_ID, makeUser('admin', 'admin-1'));

      expect(result.id).toBe(ENTRY_ID);
    });

    it('should throw NotFoundException if entry not found', async () => {
      timeEntriesRepo.findById.mockResolvedValue(null);

      await expect(
        service.findById('unknown', makeUser('admin', 'admin-1')),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if contractor tries to view another\'s entry', async () => {
      timeEntriesRepo.findById.mockResolvedValue(
        makeTimeEntry({ contractorId: OTHER_CONTRACTOR_ID }),
      );

      await expect(
        service.findById(ENTRY_ID, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update own time entry', async () => {
      const entry = makeTimeEntry();
      timeEntriesRepo.findById.mockResolvedValue(entry);
      timeEntriesRepo.update.mockResolvedValue({ ...entry, hours: 6 });

      const result = await service.update(
        ENTRY_ID,
        { hours: 6 },
        makeUser('contractor'),
      );

      expect(result.hours).toBe(6);
    });

    it('should throw NotFoundException if entry not found', async () => {
      timeEntriesRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('unknown', { hours: 6 }, makeUser('contractor')),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not own entry', async () => {
      timeEntriesRepo.findById.mockResolvedValue(
        makeTimeEntry({ contractorId: OTHER_CONTRACTOR_ID }),
      );

      await expect(
        service.update(ENTRY_ID, { hours: 6 }, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete own time entry', async () => {
      timeEntriesRepo.findById.mockResolvedValue(makeTimeEntry());
      timeEntriesRepo.delete.mockResolvedValue(undefined);

      await service.delete(ENTRY_ID, makeUser('contractor'));

      expect(timeEntriesRepo.delete).toHaveBeenCalledWith(ENTRY_ID);
    });

    it('should throw NotFoundException if entry not found', async () => {
      timeEntriesRepo.findById.mockResolvedValue(null);

      await expect(
        service.delete('unknown', makeUser('contractor')),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not own entry', async () => {
      timeEntriesRepo.findById.mockResolvedValue(
        makeTimeEntry({ contractorId: OTHER_CONTRACTOR_ID }),
      );

      await expect(
        service.delete(ENTRY_ID, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
