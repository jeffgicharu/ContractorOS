import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type CreateContractorInput,
  type UpdateContractorInput,
  type ContractorListQuery,
  type ContractorListItem,
  type ContractorDetail,
  type BulkInviteInput,
  type PaginationMeta,
  CONTRACTOR_TRANSITIONS,
  type ContractorStatus,
  isValidTransition,
} from '@contractor-os/shared';
import { ContractorsRepository } from './contractors.repository';
import { buildPaginationMeta } from '../../common/pagination/paginate';

const INVITE_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class ContractorsService {
  private readonly logger = new Logger(ContractorsService.name);

  constructor(private readonly repo: ContractorsRepository) {}

  async create(
    orgId: string,
    input: CreateContractorInput,
  ): Promise<{ id: string; email: string }> {
    const exists = await this.repo.existsByEmail(orgId, input.email);
    if (exists) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: `A contractor with email ${input.email} already exists in this organization`,
      });
    }

    const inviteToken = crypto.randomUUID();
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + INVITE_TOKEN_EXPIRY_DAYS);

    const contractor = await this.repo.create(orgId, input, inviteToken, inviteExpiresAt);

    this.logger.log(`Contractor created: ${contractor.id} (invite sent to ${input.email})`);

    return { id: contractor.id, email: contractor.email };
  }

  async list(
    orgId: string,
    query: ContractorListQuery,
  ): Promise<{ items: ContractorListItem[]; meta: PaginationMeta }> {
    const { items, total } = await this.repo.findList(orgId, query);
    const meta = buildPaginationMeta({ page: query.page, pageSize: query.pageSize }, total);

    return { items, meta };
  }

  async getDetail(orgId: string, id: string): Promise<ContractorDetail> {
    const detail = await this.repo.findDetailById(orgId, id);
    if (!detail) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${id} not found`,
      });
    }

    return detail;
  }

  async update(
    orgId: string,
    id: string,
    input: UpdateContractorInput,
  ): Promise<{ id: string }> {
    const contractor = await this.repo.findById(orgId, id);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${id} not found`,
      });
    }

    await this.repo.update(orgId, id, input);
    return { id };
  }

  async transitionStatus(
    orgId: string,
    contractorId: string,
    newStatus: ContractorStatus,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const contractor = await this.repo.findById(orgId, contractorId);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${contractorId} not found`,
      });
    }

    const currentStatus = contractor.status as ContractorStatus;
    if (!isValidTransition(CONTRACTOR_TRANSITIONS, currentStatus, newStatus)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      });
    }

    await this.repo.updateStatus(contractorId, newStatus, userId, reason);
    this.logger.log(`Contractor ${contractorId}: ${currentStatus} → ${newStatus}`);
  }

  async reinvite(orgId: string, id: string): Promise<void> {
    const contractor = await this.repo.findById(orgId, id);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Contractor ${id} not found`,
      });
    }

    if (contractor.status !== 'invite_sent') {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Can only reinvite contractors in invite_sent status',
      });
    }

    const inviteToken = crypto.randomUUID();
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + INVITE_TOKEN_EXPIRY_DAYS);

    await this.repo.updateInviteToken(id, inviteToken, inviteExpiresAt);
    this.logger.log(`Reinvite sent for contractor ${id}`);
  }

  async bulkInvite(
    orgId: string,
    input: BulkInviteInput,
  ): Promise<{ created: number; skipped: string[] }> {
    const skipped: string[] = [];
    let created = 0;

    for (const contractor of input.contractors) {
      const exists = await this.repo.existsByEmail(orgId, contractor.email);
      if (exists) {
        skipped.push(contractor.email);
        continue;
      }

      const inviteToken = crypto.randomUUID();
      const inviteExpiresAt = new Date();
      inviteExpiresAt.setDate(inviteExpiresAt.getDate() + INVITE_TOKEN_EXPIRY_DAYS);

      await this.repo.create(orgId, contractor, inviteToken, inviteExpiresAt);
      created++;
    }

    this.logger.log(`Bulk invite: ${created} created, ${skipped.length} skipped`);
    return { created, skipped };
  }
}
