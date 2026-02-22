import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OffboardingService } from './offboarding.service';
import { OffboardingRepository } from './offboarding.repository';
import { ContractorsRepository } from '../contractors/contractors.repository';
import { NotificationsService } from '../notifications/notifications.service';
import {
  OffboardingStatus,
  ChecklistItemType,
  ChecklistStatus,
  type OffboardingWorkflow,
  type OffboardingWorkflowDetail,
  type OffboardingChecklistItem,
  type Equipment,
} from '@contractor-os/shared';

const ORG_ID = 'org-1';
const CONTRACTOR_ID = 'contractor-1';
const WORKFLOW_ID = 'workflow-1';
const USER_ID = 'user-1';

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

function makeWorkflow(overrides: Partial<OffboardingWorkflow> = {}): OffboardingWorkflow {
  return {
    id: WORKFLOW_ID,
    contractorId: CONTRACTOR_ID,
    organizationId: ORG_ID,
    initiatedBy: USER_ID,
    reason: 'project_completed',
    effectiveDate: '2026-03-15',
    status: OffboardingStatus.INITIATED,
    notes: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeWorkflowDetail(overrides: Partial<OffboardingWorkflowDetail> = {}): OffboardingWorkflowDetail {
  return {
    ...makeWorkflow(),
    contractorName: 'Test User',
    initiatedByName: 'Admin User',
    checklistItems: [],
    equipment: [],
    ...overrides,
  };
}

function makeChecklistItem(overrides: Partial<OffboardingChecklistItem> = {}): OffboardingChecklistItem {
  return {
    id: 'item-1',
    workflowId: WORKFLOW_ID,
    itemType: ChecklistItemType.REVOKE_SYSTEM_ACCESS,
    status: ChecklistStatus.PENDING,
    completedBy: null,
    completedAt: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('OffboardingService', () => {
  let service: OffboardingService;
  let repo: jest.Mocked<OffboardingRepository>;
  let contractorsRepo: jest.Mocked<ContractorsRepository>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    repo = {
      createWorkflow: jest.fn(),
      findWorkflowById: jest.fn(),
      findActiveWorkflowByContractorId: jest.fn(),
      findWorkflows: jest.fn(),
      updateWorkflowStatus: jest.fn(),
      updateWorkflowNotes: jest.fn(),
      createChecklistItems: jest.fn(),
      findChecklistItems: jest.fn(),
      findChecklistItemById: jest.fn(),
      updateChecklistItem: jest.fn(),
      findEquipmentByContractorId: jest.fn(),
      createEquipment: jest.fn(),
      updateEquipmentStatus: jest.fn(),
      countPendingInvoices: jest.fn(),
      getChecklistProgress: jest.fn(),
    } as unknown as jest.Mocked<OffboardingRepository>;

    contractorsRepo = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<ContractorsRepository>;

    notificationsService = {
      create: jest.fn().mockResolvedValue(undefined),
      createForAdmins: jest.fn().mockResolvedValue(undefined),
      findContractorUserId: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<NotificationsService>;

    service = new OffboardingService(repo, contractorsRepo, notificationsService);
  });

  // ──────────────────────────────────────────────────────────
  // initiateOffboarding
  // ──────────────────────────────────────────────────────────

  describe('initiateOffboarding', () => {
    it('creates a workflow with auto-generated checklist', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(null);
      repo.createWorkflow.mockResolvedValue(makeWorkflow());
      repo.findEquipmentByContractorId.mockResolvedValue([]);
      repo.countPendingInvoices.mockResolvedValue(0);
      repo.createChecklistItems.mockResolvedValue([]);
      repo.findWorkflowById.mockResolvedValue(makeWorkflowDetail());

      const result = await service.initiateOffboarding(
        CONTRACTOR_ID,
        ORG_ID,
        USER_ID,
        { reason: 'project_completed', effectiveDate: '2026-03-15' },
      );

      expect(result).toBeDefined();
      expect(repo.createWorkflow).toHaveBeenCalledWith(expect.objectContaining({
        contractorId: CONTRACTOR_ID,
        reason: 'project_completed',
      }));
      expect(repo.createChecklistItems).toHaveBeenCalledWith(
        WORKFLOW_ID,
        expect.arrayContaining([
          expect.objectContaining({ itemType: ChecklistItemType.REVOKE_SYSTEM_ACCESS }),
        ]),
      );
    });

    it('creates 9 checklist items', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(null);
      repo.createWorkflow.mockResolvedValue(makeWorkflow());
      repo.findEquipmentByContractorId.mockResolvedValue([]);
      repo.countPendingInvoices.mockResolvedValue(0);
      repo.createChecklistItems.mockResolvedValue([]);
      repo.findWorkflowById.mockResolvedValue(makeWorkflowDetail());

      await service.initiateOffboarding(
        CONTRACTOR_ID, ORG_ID, USER_ID,
        { reason: 'project_completed', effectiveDate: '2026-03-15' },
      );

      const items = repo.createChecklistItems.mock.calls[0]![1];
      expect(items).toHaveLength(9);
    });

    it('sets retrieve_equipment to not_applicable when no equipment', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(null);
      repo.createWorkflow.mockResolvedValue(makeWorkflow());
      repo.findEquipmentByContractorId.mockResolvedValue([]);
      repo.countPendingInvoices.mockResolvedValue(0);
      repo.createChecklistItems.mockResolvedValue([]);
      repo.findWorkflowById.mockResolvedValue(makeWorkflowDetail());

      await service.initiateOffboarding(
        CONTRACTOR_ID, ORG_ID, USER_ID,
        { reason: 'project_completed', effectiveDate: '2026-03-15' },
      );

      const items = repo.createChecklistItems.mock.calls[0]![1];
      const equipItem = items.find(
        (i: { itemType: string }) => i.itemType === ChecklistItemType.RETRIEVE_EQUIPMENT,
      );
      expect(equipItem!.status).toBe(ChecklistStatus.NOT_APPLICABLE);
    });

    it('sets retrieve_equipment to pending when equipment exists', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(null);
      repo.createWorkflow.mockResolvedValue(makeWorkflow());
      repo.findEquipmentByContractorId.mockResolvedValue([{} as Equipment]);
      repo.countPendingInvoices.mockResolvedValue(0);
      repo.createChecklistItems.mockResolvedValue([]);
      repo.findWorkflowById.mockResolvedValue(makeWorkflowDetail());

      await service.initiateOffboarding(
        CONTRACTOR_ID, ORG_ID, USER_ID,
        { reason: 'project_completed', effectiveDate: '2026-03-15' },
      );

      const items = repo.createChecklistItems.mock.calls[0]![1];
      const equipItem = items.find(
        (i: { itemType: string }) => i.itemType === ChecklistItemType.RETRIEVE_EQUIPMENT,
      );
      expect(equipItem!.status).toBe(ChecklistStatus.PENDING);
    });

    it('sets process_final_invoice to not_applicable when no pending invoices', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(null);
      repo.createWorkflow.mockResolvedValue(makeWorkflow());
      repo.findEquipmentByContractorId.mockResolvedValue([]);
      repo.countPendingInvoices.mockResolvedValue(0);
      repo.createChecklistItems.mockResolvedValue([]);
      repo.findWorkflowById.mockResolvedValue(makeWorkflowDetail());

      await service.initiateOffboarding(
        CONTRACTOR_ID, ORG_ID, USER_ID,
        { reason: 'project_completed', effectiveDate: '2026-03-15' },
      );

      const items = repo.createChecklistItems.mock.calls[0]![1];
      const invoiceItem = items.find(
        (i: { itemType: string }) => i.itemType === ChecklistItemType.PROCESS_FINAL_INVOICE,
      );
      expect(invoiceItem!.status).toBe(ChecklistStatus.NOT_APPLICABLE);
    });

    it('sets process_final_invoice to pending when invoices exist', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(null);
      repo.createWorkflow.mockResolvedValue(makeWorkflow());
      repo.findEquipmentByContractorId.mockResolvedValue([]);
      repo.countPendingInvoices.mockResolvedValue(3);
      repo.createChecklistItems.mockResolvedValue([]);
      repo.findWorkflowById.mockResolvedValue(makeWorkflowDetail());

      await service.initiateOffboarding(
        CONTRACTOR_ID, ORG_ID, USER_ID,
        { reason: 'project_completed', effectiveDate: '2026-03-15' },
      );

      const items = repo.createChecklistItems.mock.calls[0]![1];
      const invoiceItem = items.find(
        (i: { itemType: string }) => i.itemType === ChecklistItemType.PROCESS_FINAL_INVOICE,
      );
      expect(invoiceItem!.status).toBe(ChecklistStatus.PENDING);
    });

    it('throws NotFoundException if contractor not found', async () => {
      contractorsRepo.findById.mockResolvedValue(null);

      await expect(
        service.initiateOffboarding(CONTRACTOR_ID, ORG_ID, USER_ID, {
          reason: 'project_completed',
          effectiveDate: '2026-03-15',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if contractor is not active or suspended', async () => {
      contractorsRepo.findById.mockResolvedValue({
        ...MOCK_CONTRACTOR_ACTIVE,
        status: 'offboarded',
      });

      await expect(
        service.initiateOffboarding(CONTRACTOR_ID, ORG_ID, USER_ID, {
          reason: 'project_completed',
          effectiveDate: '2026-03-15',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if active workflow already exists', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(makeWorkflow());

      await expect(
        service.initiateOffboarding(CONTRACTOR_ID, ORG_ID, USER_ID, {
          reason: 'project_completed',
          effectiveDate: '2026-03-15',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows offboarding for suspended contractors', async () => {
      contractorsRepo.findById.mockResolvedValue({
        ...MOCK_CONTRACTOR_ACTIVE,
        status: 'suspended',
      });
      repo.findActiveWorkflowByContractorId.mockResolvedValue(null);
      repo.createWorkflow.mockResolvedValue(makeWorkflow());
      repo.findEquipmentByContractorId.mockResolvedValue([]);
      repo.countPendingInvoices.mockResolvedValue(0);
      repo.createChecklistItems.mockResolvedValue([]);
      repo.findWorkflowById.mockResolvedValue(makeWorkflowDetail());

      const result = await service.initiateOffboarding(
        CONTRACTOR_ID, ORG_ID, USER_ID,
        { reason: 'performance', effectiveDate: '2026-03-15' },
      );

      expect(result).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────
  // getWorkflow
  // ──────────────────────────────────────────────────────────

  describe('getWorkflow', () => {
    it('returns workflow detail', async () => {
      const detail = makeWorkflowDetail();
      repo.findWorkflowById.mockResolvedValue(detail);

      const result = await service.getWorkflow(WORKFLOW_ID, ORG_ID);
      expect(result.id).toBe(WORKFLOW_ID);
    });

    it('throws NotFoundException if workflow not found', async () => {
      repo.findWorkflowById.mockResolvedValue(null);

      await expect(service.getWorkflow('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if workflow belongs to different org', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ organizationId: 'other-org' }),
      );

      await expect(service.getWorkflow(WORKFLOW_ID, ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────
  // getWorkflowByContractor
  // ──────────────────────────────────────────────────────────

  describe('getWorkflowByContractor', () => {
    it('returns null if no active workflow', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(null);

      const result = await service.getWorkflowByContractor(CONTRACTOR_ID, ORG_ID);
      expect(result).toBeNull();
    });

    it('returns workflow detail if active workflow exists', async () => {
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);
      repo.findActiveWorkflowByContractorId.mockResolvedValue(makeWorkflow());
      repo.findWorkflowById.mockResolvedValue(makeWorkflowDetail());

      const result = await service.getWorkflowByContractor(CONTRACTOR_ID, ORG_ID);
      expect(result).toBeDefined();
      expect(result!.id).toBe(WORKFLOW_ID);
    });

    it('throws NotFoundException if contractor not found', async () => {
      contractorsRepo.findById.mockResolvedValue(null);

      await expect(
        service.getWorkflowByContractor('nonexistent', ORG_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────
  // updateWorkflowStatus
  // ──────────────────────────────────────────────────────────

  describe('updateWorkflowStatus', () => {
    it('transitions initiated to in_progress', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.INITIATED }),
      );

      await service.updateWorkflowStatus(WORKFLOW_ID, ORG_ID, OffboardingStatus.IN_PROGRESS);

      expect(repo.updateWorkflowStatus).toHaveBeenCalledWith(
        WORKFLOW_ID,
        OffboardingStatus.IN_PROGRESS,
        undefined,
      );
    });

    it('transitions initiated to cancelled', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.INITIATED }),
      );

      await service.updateWorkflowStatus(WORKFLOW_ID, ORG_ID, OffboardingStatus.CANCELLED);

      expect(repo.updateWorkflowStatus).toHaveBeenCalledWith(
        WORKFLOW_ID,
        OffboardingStatus.CANCELLED,
        undefined,
      );
    });

    it('transitions in_progress to completed and offboards contractor', async () => {
      repo.findWorkflowById
        .mockResolvedValueOnce(makeWorkflowDetail({ status: OffboardingStatus.IN_PROGRESS }))
        .mockResolvedValueOnce(makeWorkflowDetail({ status: OffboardingStatus.COMPLETED }));
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);

      await service.updateWorkflowStatus(WORKFLOW_ID, ORG_ID, OffboardingStatus.COMPLETED);

      expect(repo.updateWorkflowStatus).toHaveBeenCalledWith(
        WORKFLOW_ID,
        OffboardingStatus.COMPLETED,
        expect.any(String),
      );
      expect(contractorsRepo.updateStatus).toHaveBeenCalledWith(
        CONTRACTOR_ID,
        'offboarded',
        USER_ID,
        'Offboarding workflow completed',
      );
    });

    it('rejects invalid transition (initiated to completed)', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.INITIATED }),
      );

      await expect(
        service.updateWorkflowStatus(WORKFLOW_ID, ORG_ID, OffboardingStatus.COMPLETED),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects transition from completed', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.COMPLETED }),
      );

      await expect(
        service.updateWorkflowStatus(WORKFLOW_ID, ORG_ID, OffboardingStatus.IN_PROGRESS),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects transition from cancelled', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.CANCELLED }),
      );

      await expect(
        service.updateWorkflowStatus(WORKFLOW_ID, ORG_ID, OffboardingStatus.IN_PROGRESS),
      ).rejects.toThrow(BadRequestException);
    });

    it('transitions in_progress to pending_final_invoice', async () => {
      repo.findWorkflowById
        .mockResolvedValueOnce(makeWorkflowDetail({ status: OffboardingStatus.IN_PROGRESS }))
        .mockResolvedValueOnce(makeWorkflowDetail({ status: OffboardingStatus.PENDING_FINAL_INVOICE }));

      await service.updateWorkflowStatus(
        WORKFLOW_ID, ORG_ID, OffboardingStatus.PENDING_FINAL_INVOICE,
      );

      expect(repo.updateWorkflowStatus).toHaveBeenCalledWith(
        WORKFLOW_ID,
        OffboardingStatus.PENDING_FINAL_INVOICE,
        undefined,
      );
    });

    it('transitions pending_final_invoice to completed', async () => {
      repo.findWorkflowById
        .mockResolvedValueOnce(makeWorkflowDetail({ status: OffboardingStatus.PENDING_FINAL_INVOICE }))
        .mockResolvedValueOnce(makeWorkflowDetail({ status: OffboardingStatus.COMPLETED }));
      contractorsRepo.findById.mockResolvedValue(MOCK_CONTRACTOR_ACTIVE);

      await service.updateWorkflowStatus(WORKFLOW_ID, ORG_ID, OffboardingStatus.COMPLETED);

      expect(repo.updateWorkflowStatus).toHaveBeenCalledWith(
        WORKFLOW_ID,
        OffboardingStatus.COMPLETED,
        expect.any(String),
      );
    });

    it('saves notes if provided', async () => {
      repo.findWorkflowById
        .mockResolvedValueOnce(makeWorkflowDetail({ status: OffboardingStatus.INITIATED }))
        .mockResolvedValueOnce(makeWorkflowDetail({ status: OffboardingStatus.IN_PROGRESS }));

      await service.updateWorkflowStatus(
        WORKFLOW_ID, ORG_ID, OffboardingStatus.IN_PROGRESS, 'Starting process',
      );

      expect(repo.updateWorkflowNotes).toHaveBeenCalledWith(WORKFLOW_ID, 'Starting process');
    });

    it('throws NotFoundException for wrong org', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ organizationId: 'other-org' }),
      );

      await expect(
        service.updateWorkflowStatus(WORKFLOW_ID, ORG_ID, OffboardingStatus.IN_PROGRESS),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────
  // updateChecklistItem
  // ──────────────────────────────────────────────────────────

  describe('updateChecklistItem', () => {
    it('updates checklist item status', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.IN_PROGRESS }),
      );
      repo.findChecklistItemById.mockResolvedValue(makeChecklistItem());
      repo.updateChecklistItem.mockResolvedValue(
        makeChecklistItem({ status: ChecklistStatus.COMPLETED }),
      );

      await service.updateChecklistItem(
        WORKFLOW_ID, 'item-1', ORG_ID, USER_ID,
        { status: ChecklistStatus.COMPLETED },
      );

      expect(repo.updateChecklistItem).toHaveBeenCalledWith('item-1', {
        status: ChecklistStatus.COMPLETED,
        completedBy: USER_ID,
        notes: undefined,
      });
    });

    it('throws if workflow is completed', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.COMPLETED }),
      );

      await expect(
        service.updateChecklistItem(WORKFLOW_ID, 'item-1', ORG_ID, USER_ID, {
          status: ChecklistStatus.COMPLETED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if workflow is cancelled', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.CANCELLED }),
      );

      await expect(
        service.updateChecklistItem(WORKFLOW_ID, 'item-1', ORG_ID, USER_ID, {
          status: ChecklistStatus.COMPLETED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if item not in workflow', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.IN_PROGRESS }),
      );
      repo.findChecklistItemById.mockResolvedValue(
        makeChecklistItem({ workflowId: 'other-workflow' }),
      );

      await expect(
        service.updateChecklistItem(WORKFLOW_ID, 'item-1', ORG_ID, USER_ID, {
          status: ChecklistStatus.COMPLETED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if item not found', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.IN_PROGRESS }),
      );
      repo.findChecklistItemById.mockResolvedValue(null);

      await expect(
        service.updateChecklistItem(WORKFLOW_ID, 'nonexistent', ORG_ID, USER_ID, {
          status: ChecklistStatus.COMPLETED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('passes notes to repository', async () => {
      repo.findWorkflowById.mockResolvedValue(
        makeWorkflowDetail({ status: OffboardingStatus.IN_PROGRESS }),
      );
      repo.findChecklistItemById.mockResolvedValue(makeChecklistItem());
      repo.updateChecklistItem.mockResolvedValue(
        makeChecklistItem({ status: ChecklistStatus.COMPLETED }),
      );

      await service.updateChecklistItem(
        WORKFLOW_ID, 'item-1', ORG_ID, USER_ID,
        { status: ChecklistStatus.COMPLETED, notes: 'Done by IT team' },
      );

      expect(repo.updateChecklistItem).toHaveBeenCalledWith('item-1', {
        status: ChecklistStatus.COMPLETED,
        completedBy: USER_ID,
        notes: 'Done by IT team',
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  // listWorkflows
  // ──────────────────────────────────────────────────────────

  describe('listWorkflows', () => {
    it('passes filters to repository', async () => {
      repo.findWorkflows.mockResolvedValue({ items: [], total: 0 });

      await service.listWorkflows(ORG_ID, {
        status: OffboardingStatus.IN_PROGRESS,
        page: 2,
        limit: 10,
      });

      expect(repo.findWorkflows).toHaveBeenCalledWith(ORG_ID, {
        status: OffboardingStatus.IN_PROGRESS,
        page: 2,
        limit: 10,
      });
    });

    it('returns items and total', async () => {
      repo.findWorkflows.mockResolvedValue({
        items: [{ ...makeWorkflow(), contractorName: 'Test', progress: 50 }],
        total: 1,
      });

      const result = await service.listWorkflows(ORG_ID, { page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
