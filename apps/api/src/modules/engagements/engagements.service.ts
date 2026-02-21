import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type Engagement,
  type CreateEngagementInput,
  type UpdateEngagementInput,
  type EngagementStatus,
  ENGAGEMENT_TRANSITIONS,
  isValidTransition,
} from '@contractor-os/shared';
import { EngagementsRepository } from './engagements.repository';
import { ContractorsRepository } from '../contractors/contractors.repository';

@Injectable()
export class EngagementsService {
  private readonly logger = new Logger(EngagementsService.name);

  constructor(
    private readonly repo: EngagementsRepository,
    private readonly contractorsRepo: ContractorsRepository,
  ) {}

  async create(
    orgId: string,
    contractorId: string,
    input: CreateEngagementInput,
  ): Promise<Engagement> {
    const contractor = await this.contractorsRepo.findById(orgId, contractorId);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${contractorId} not found`,
      });
    }

    if (contractor.status !== 'active') {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Engagements can only be created for active contractors',
      });
    }

    const engagement = await this.repo.create(orgId, contractorId, input);
    this.logger.log(`Engagement created: ${engagement.id} for contractor ${contractorId}`);
    return engagement;
  }

  async findByContractor(orgId: string, contractorId: string): Promise<Engagement[]> {
    const contractor = await this.contractorsRepo.findById(orgId, contractorId);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${contractorId} not found`,
      });
    }

    return this.repo.findByContractorId(orgId, contractorId);
  }

  async findById(orgId: string, id: string): Promise<Engagement> {
    const engagement = await this.repo.findById(id);
    if (!engagement || engagement.organizationId !== orgId) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Engagement ${id} not found`,
      });
    }

    return engagement;
  }

  async update(orgId: string, id: string, input: UpdateEngagementInput): Promise<Engagement> {
    const engagement = await this.repo.findById(id);
    if (!engagement || engagement.organizationId !== orgId) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Engagement ${id} not found`,
      });
    }

    if (engagement.status === 'completed' || engagement.status === 'cancelled') {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: `Cannot update engagement in ${engagement.status} status`,
      });
    }

    const updated = await this.repo.update(id, input);
    return updated!;
  }

  async transitionStatus(
    orgId: string,
    id: string,
    newStatus: EngagementStatus,
  ): Promise<void> {
    const engagement = await this.repo.findById(id);
    if (!engagement || engagement.organizationId !== orgId) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Engagement ${id} not found`,
      });
    }

    const currentStatus = engagement.status;
    if (!isValidTransition(ENGAGEMENT_TRANSITIONS, currentStatus, newStatus)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      });
    }

    await this.repo.updateStatus(id, newStatus);
    this.logger.log(`Engagement ${id}: ${currentStatus} → ${newStatus}`);
  }
}
