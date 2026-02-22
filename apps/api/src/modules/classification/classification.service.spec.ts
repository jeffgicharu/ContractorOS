import { NotFoundException } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { ClassificationRepository } from './classification.repository';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  ClassificationAssessment,
  ClassificationFactor,
  ClassificationInputData,
  RiskSummaryView,
} from '@contractor-os/shared';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

const ORG_ID = 'org-1';
const CONTRACTOR_ID = 'contractor-1';

function makeUser(role = 'admin'): JwtPayload {
  return { sub: 'user-1', orgId: ORG_ID, role };
}

function makeAssessment(overrides: Partial<ClassificationAssessment> = {}): ClassificationAssessment {
  return {
    id: 'assessment-1',
    contractorId: CONTRACTOR_ID,
    organizationId: ORG_ID,
    assessedAt: new Date().toISOString(),
    overallRisk: 'medium',
    overallScore: 45,
    irsScore: 50,
    irsFactors: {
      behavioral_control: { score: 20, max: 40, factors: {} as never },
      financial_control: { score: 15, max: 30, factors: {} as never },
      relationship_type: { score: 15, max: 30, factors: {} as never },
    },
    dolScore: 40,
    dolFactors: {} as never,
    abcScore: 45,
    abcFactors: {
      prong_a: { passed: false, weight: 34, score: 34 },
      prong_b: { passed: true, weight: 33, score: 0 },
      prong_c: { passed: false, weight: 33, score: 11 },
    },
    inputData: { hoursPerWeek: 30 },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeFactor(overrides: Partial<ClassificationFactor> = {}): ClassificationFactor {
  return {
    id: 'factor-1',
    contractorId: CONTRACTOR_ID,
    category: 'set_schedule',
    numericValue: null,
    booleanValue: true,
    textValue: null,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ClassificationService', () => {
  let service: ClassificationService;
  let repo: jest.Mocked<ClassificationRepository>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    repo = {
      createAssessment: jest.fn(),
      findLatestAssessment: jest.fn(),
      findAssessmentHistory: jest.fn(),
      findFactors: jest.fn(),
      createFactor: jest.fn(),
      getComputedFactorsFromTimeEntries: jest.fn(),
      getDashboardSummary: jest.fn(),
      refreshMaterializedView: jest.fn(),
      getActiveContractorIds: jest.fn(),
      getAllOrgIds: jest.fn(),
      getContractorOrgId: jest.fn(),
    } as unknown as jest.Mocked<ClassificationRepository>;

    notificationsService = {
      create: jest.fn().mockResolvedValue(undefined),
      createForAdmins: jest.fn().mockResolvedValue(undefined),
      findContractorUserId: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<NotificationsService>;

    service = new ClassificationService(repo, notificationsService);
  });

  describe('runAssessment', () => {
    it('should compute factors, score all tests, and persist assessment', async () => {
      repo.getComputedFactorsFromTimeEntries.mockResolvedValue({
        avgWeeklyHours: 35,
        totalWeeks: 20,
        engagementCount: 1,
      });
      repo.findFactors.mockResolvedValue([]);
      repo.createAssessment.mockResolvedValue(makeAssessment());

      const result = await service.runAssessment(CONTRACTOR_ID, ORG_ID);

      expect(repo.getComputedFactorsFromTimeEntries).toHaveBeenCalledWith(CONTRACTOR_ID);
      expect(repo.findFactors).toHaveBeenCalledWith(CONTRACTOR_ID);
      expect(repo.createAssessment).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    it('should merge manual factors over computed ones', async () => {
      repo.getComputedFactorsFromTimeEntries.mockResolvedValue({
        avgWeeklyHours: 20,
        totalWeeks: 10,
        engagementCount: 1,
      });
      repo.findFactors.mockResolvedValue([
        makeFactor({ category: 'set_schedule', booleanValue: true }),
        makeFactor({ category: 'tools_provided', booleanValue: true }),
      ]);
      repo.createAssessment.mockImplementation(async (input) => makeAssessment({
        inputData: input.inputData,
      }));

      await service.runAssessment(CONTRACTOR_ID, ORG_ID);

      const callArgs = repo.createAssessment.mock.calls[0]![0];
      expect(callArgs.inputData.setSchedule).toBe(true);
      expect(callArgs.inputData.toolsProvided).toBe(true);
    });

    it('should use computed hoursPerWeek and durationWeeks from time entries', async () => {
      repo.getComputedFactorsFromTimeEntries.mockResolvedValue({
        avgWeeklyHours: 42,
        totalWeeks: 30,
        engagementCount: 2,
      });
      repo.findFactors.mockResolvedValue([]);
      repo.createAssessment.mockImplementation(async (input) => makeAssessment({
        inputData: input.inputData,
      }));

      await service.runAssessment(CONTRACTOR_ID, ORG_ID);

      const callArgs = repo.createAssessment.mock.calls[0]![0];
      expect(callArgs.inputData.hoursPerWeek).toBe(42);
      expect(callArgs.inputData.engagementDurationWeeks).toBe(30);
      expect(callArgs.inputData.multipleClients).toBe(true);
    });
  });

  describe('getLatestAssessment', () => {
    it('should return assessment when found', async () => {
      const assessment = makeAssessment();
      repo.findLatestAssessment.mockResolvedValue(assessment);

      const result = await service.getLatestAssessment(CONTRACTOR_ID, makeUser());
      expect(result).toEqual(assessment);
    });

    it('should throw NotFoundException when no assessment found', async () => {
      repo.findLatestAssessment.mockResolvedValue(null);

      await expect(service.getLatestAssessment(CONTRACTOR_ID, makeUser()))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getAssessmentHistory', () => {
    it('should return list of assessments', async () => {
      const assessments = [makeAssessment(), makeAssessment({ id: 'a2' })];
      repo.findAssessmentHistory.mockResolvedValue(assessments);

      const result = await service.getAssessmentHistory(CONTRACTOR_ID, 10);
      expect(result).toHaveLength(2);
      expect(repo.findAssessmentHistory).toHaveBeenCalledWith(CONTRACTOR_ID, 10);
    });
  });

  describe('getDashboard', () => {
    it('should return summary with counts and top risk contractors', async () => {
      repo.getDashboardSummary.mockResolvedValue({
        summary: { low: 5, medium: 3, high: 2, critical: 1 },
        topRisk: [{
          contractorId: CONTRACTOR_ID,
          organizationId: ORG_ID,
          contractorName: 'John Smith',
          contractorStatus: 'active',
          overallRisk: 'high',
          overallScore: 65,
          irsScore: 70,
          dolScore: 60,
          abcScore: 65,
          assessedAt: new Date().toISOString(),
          avgWeeklyHours: 40,
          weeksActive: 20,
          engagementCount: 1,
        } as RiskSummaryView],
      });

      const result = await service.getDashboard(makeUser());
      expect(result.summary.total).toBe(11);
      expect(result.summary.low).toBe(5);
      expect(result.topRiskContractors).toHaveLength(1);
      expect(result.topRiskContractors[0]!.contractorName).toBe('John Smith');
    });
  });

  describe('getFactors', () => {
    it('should return factors list', async () => {
      repo.findFactors.mockResolvedValue([makeFactor()]);

      const result = await service.getFactors(CONTRACTOR_ID);
      expect(result).toHaveLength(1);
    });

    it('should pass category and source filters', async () => {
      repo.findFactors.mockResolvedValue([]);

      await service.getFactors(CONTRACTOR_ID, 'set_schedule', 'manual');
      expect(repo.findFactors).toHaveBeenCalledWith(CONTRACTOR_ID, 'set_schedule', 'manual');
    });
  });

  describe('submitFactor', () => {
    it('should create a manual factor', async () => {
      const factor = makeFactor();
      repo.createFactor.mockResolvedValue(factor);

      const result = await service.submitFactor(CONTRACTOR_ID, {
        category: 'set_schedule',
        booleanValue: true,
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
      });

      expect(result).toEqual(factor);
      expect(repo.createFactor).toHaveBeenCalledWith(
        expect.objectContaining({
          contractorId: CONTRACTOR_ID,
          source: 'manual',
        }),
      );
    });
  });

  describe('reassessAllActive', () => {
    it('should reassess all active contractors across all orgs', async () => {
      repo.getAllOrgIds.mockResolvedValue([ORG_ID]);
      repo.getActiveContractorIds.mockResolvedValue(['c1', 'c2']);
      repo.getComputedFactorsFromTimeEntries.mockResolvedValue({
        avgWeeklyHours: 20,
        totalWeeks: 10,
        engagementCount: 1,
      });
      repo.findFactors.mockResolvedValue([]);
      repo.createAssessment.mockResolvedValue(makeAssessment());
      repo.refreshMaterializedView.mockResolvedValue();

      await service.reassessAllActive();

      expect(repo.createAssessment).toHaveBeenCalledTimes(2);
      expect(repo.refreshMaterializedView).toHaveBeenCalledTimes(1);
    });

    it('should continue processing when one contractor fails', async () => {
      repo.getAllOrgIds.mockResolvedValue([ORG_ID]);
      repo.getActiveContractorIds.mockResolvedValue(['c1', 'c2']);
      repo.getComputedFactorsFromTimeEntries
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValue({
          avgWeeklyHours: 20,
          totalWeeks: 10,
          engagementCount: 1,
        });
      repo.findFactors.mockResolvedValue([]);
      repo.createAssessment.mockResolvedValue(makeAssessment());
      repo.refreshMaterializedView.mockResolvedValue();

      await service.reassessAllActive();

      expect(repo.createAssessment).toHaveBeenCalledTimes(1);
      expect(repo.refreshMaterializedView).toHaveBeenCalledTimes(1);
    });
  });
});
