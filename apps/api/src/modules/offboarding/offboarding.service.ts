import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type OffboardingWorkflowDetail,
  type OffboardingWorkflow,
  type InitiateOffboardingInput,
  type OffboardingStatus,
  type ChecklistStatus,
  ChecklistItemType,
  OFFBOARDING_TRANSITIONS,
  CONTRACTOR_TRANSITIONS,
  ContractorStatus,
  OffboardingStatus as OffboardingStatusEnum,
  ChecklistStatus as ChecklistStatusEnum,
  isValidTransition,
} from '@contractor-os/shared';
import { OffboardingRepository } from './offboarding.repository';
import { ContractorsRepository } from '../contractors/contractors.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OffboardingService {
  private readonly logger = new Logger(OffboardingService.name);

  constructor(
    private readonly repo: OffboardingRepository,
    private readonly contractorsRepo: ContractorsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async initiateOffboarding(
    contractorId: string,
    orgId: string,
    initiatedBy: string,
    input: InitiateOffboardingInput,
  ): Promise<OffboardingWorkflowDetail> {
    const contractor = await this.contractorsRepo.findById(orgId, contractorId);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${contractorId} not found`,
      });
    }

    if (contractor.status !== 'active' && contractor.status !== 'suspended') {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: `Cannot offboard contractor in ${contractor.status} status`,
      });
    }

    const existing = await this.repo.findActiveWorkflowByContractorId(contractorId);
    if (existing) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'An active offboarding workflow already exists for this contractor',
      });
    }

    const workflow = await this.repo.createWorkflow({
      contractorId,
      organizationId: orgId,
      initiatedBy,
      reason: input.reason,
      effectiveDate: input.effectiveDate,
      notes: input.notes,
    });

    await this.generateChecklist(workflow.id, contractorId);

    this.logger.log(`Offboarding initiated for contractor ${contractorId}: ${workflow.id}`);

    // Notify admins and the contractor
    const contractorName = `${contractor.first_name} ${contractor.last_name}`;
    this.notificationsService.createForAdmins(
      orgId,
      'offboarding_started' as import('@contractor-os/shared').NotificationType,
      'Offboarding Started',
      `Offboarding initiated for ${contractorName}`,
      { workflowId: workflow.id, contractorId, contractorName },
    ).catch((err) => this.logger.error('Failed to send offboarding_started notification', err));

    const contractorUserId = await this.notificationsService.findContractorUserId(contractorId);
    if (contractorUserId) {
      this.notificationsService.create(
        contractorUserId,
        'offboarding_started' as import('@contractor-os/shared').NotificationType,
        'Offboarding Notice',
        `Your offboarding process has been initiated`,
        { workflowId: workflow.id },
      ).catch((err) => this.logger.error('Failed to send contractor offboarding notification', err));
    }

    const detail = await this.repo.findWorkflowById(workflow.id);
    return detail!;
  }

  async getWorkflow(id: string, orgId: string): Promise<OffboardingWorkflowDetail> {
    const workflow = await this.repo.findWorkflowById(id);
    if (!workflow || workflow.organizationId !== orgId) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Offboarding workflow ${id} not found`,
      });
    }
    return workflow;
  }

  async getWorkflowByContractor(
    contractorId: string,
    orgId: string,
  ): Promise<OffboardingWorkflowDetail | null> {
    const contractor = await this.contractorsRepo.findById(orgId, contractorId);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${contractorId} not found`,
      });
    }

    const active = await this.repo.findActiveWorkflowByContractorId(contractorId);
    if (!active) return null;

    return this.repo.findWorkflowById(active.id);
  }

  async listWorkflows(
    orgId: string,
    filters: { status?: OffboardingStatus; page: number; limit: number },
  ): Promise<{
    items: (OffboardingWorkflow & { contractorName: string; progress: number })[];
    total: number;
  }> {
    return this.repo.findWorkflows(orgId, filters);
  }

  async updateWorkflowStatus(
    id: string,
    orgId: string,
    newStatus: OffboardingStatus,
    notes?: string,
  ): Promise<OffboardingWorkflowDetail> {
    const workflow = await this.repo.findWorkflowById(id);
    if (!workflow || workflow.organizationId !== orgId) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Offboarding workflow ${id} not found`,
      });
    }

    const currentStatus = workflow.status;
    if (!isValidTransition(OFFBOARDING_TRANSITIONS, currentStatus, newStatus)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      });
    }

    const completedAt = newStatus === OffboardingStatusEnum.COMPLETED
      ? new Date().toISOString()
      : undefined;

    await this.repo.updateWorkflowStatus(id, newStatus, completedAt);

    if (notes) {
      await this.repo.updateWorkflowNotes(id, notes);
    }

    if (newStatus === OffboardingStatusEnum.COMPLETED) {
      const contractorStatus = workflow.contractorId
        ? await this.contractorsRepo.findById(orgId, workflow.contractorId)
        : null;

      if (
        contractorStatus &&
        isValidTransition(
          CONTRACTOR_TRANSITIONS,
          contractorStatus.status as ContractorStatus,
          ContractorStatus.OFFBOARDED,
        )
      ) {
        await this.contractorsRepo.updateStatus(
          workflow.contractorId,
          ContractorStatus.OFFBOARDED,
          workflow.initiatedBy,
          'Offboarding workflow completed',
        );
        this.logger.log(`Contractor ${workflow.contractorId} transitioned to offboarded`);
      }
    }

    this.logger.log(`Offboarding ${id}: ${currentStatus} → ${newStatus}`);

    return (await this.repo.findWorkflowById(id))!;
  }

  async updateChecklistItem(
    workflowId: string,
    itemId: string,
    orgId: string,
    userId: string,
    data: { status: ChecklistStatus; notes?: string },
  ): Promise<OffboardingWorkflowDetail> {
    const workflow = await this.repo.findWorkflowById(workflowId);
    if (!workflow || workflow.organizationId !== orgId) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Offboarding workflow ${workflowId} not found`,
      });
    }

    if (
      workflow.status === OffboardingStatusEnum.COMPLETED ||
      workflow.status === OffboardingStatusEnum.CANCELLED
    ) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: `Cannot update checklist on ${workflow.status} workflow`,
      });
    }

    const item = await this.repo.findChecklistItemById(itemId);
    if (!item || item.workflowId !== workflowId) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Checklist item ${itemId} not found in workflow ${workflowId}`,
      });
    }

    await this.repo.updateChecklistItem(itemId, {
      status: data.status,
      completedBy: userId,
      notes: data.notes,
    });

    this.logger.log(`Checklist item ${itemId}: ${item.status} → ${data.status}`);

    return (await this.repo.findWorkflowById(workflowId))!;
  }

  private async generateChecklist(workflowId: string, contractorId: string): Promise<void> {
    const equipment = await this.repo.findEquipmentByContractorId(contractorId);
    const pendingInvoices = await this.repo.countPendingInvoices(contractorId);
    const hasEquipment = equipment.length > 0;
    const hasPendingInvoices = pendingInvoices > 0;

    const allItemTypes: ChecklistItemType[] = [
      ChecklistItemType.REVOKE_SYSTEM_ACCESS,
      ChecklistItemType.REVOKE_CODE_REPO_ACCESS,
      ChecklistItemType.REVOKE_COMMUNICATION_TOOLS,
      ChecklistItemType.RETRIEVE_EQUIPMENT,
      ChecklistItemType.PROCESS_FINAL_INVOICE,
      ChecklistItemType.ARCHIVE_DOCUMENTS,
      ChecklistItemType.FREEZE_TAX_DATA,
      ChecklistItemType.EXIT_INTERVIEW,
      ChecklistItemType.REMOVE_FROM_TOOLS,
    ];

    const items = allItemTypes.map((itemType) => {
      let status: ChecklistStatus = ChecklistStatusEnum.PENDING;

      if (itemType === ChecklistItemType.RETRIEVE_EQUIPMENT && !hasEquipment) {
        status = ChecklistStatusEnum.NOT_APPLICABLE;
      }
      if (itemType === ChecklistItemType.PROCESS_FINAL_INVOICE && !hasPendingInvoices) {
        status = ChecklistStatusEnum.NOT_APPLICABLE;
      }

      return { itemType, status };
    });

    await this.repo.createChecklistItems(workflowId, items);
  }
}
