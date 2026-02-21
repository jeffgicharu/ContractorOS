import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  TimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  TimeEntryListQuery,
  PaginationMeta,
} from '@contractor-os/shared';
import { TimeEntriesRepository } from './time-entries.repository';
import { EngagementsRepository } from '../engagements/engagements.repository';
import { buildPaginationMeta } from '../../common/pagination/paginate';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class TimeEntriesService {
  private readonly logger = new Logger(TimeEntriesService.name);

  constructor(
    private readonly repo: TimeEntriesRepository,
    private readonly engagementsRepo: EngagementsRepository,
  ) {}

  async create(contractorId: string, input: CreateTimeEntryInput): Promise<TimeEntry> {
    const engagement = await this.engagementsRepo.findById(input.engagementId);
    if (!engagement) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Engagement ${input.engagementId} not found`,
      });
    }

    if (engagement.contractorId !== contractorId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only log time for your own engagements',
      });
    }

    if (engagement.status !== 'active') {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Time entries can only be logged for active engagements',
      });
    }

    const entry = await this.repo.create(contractorId, input);
    this.logger.log(`Time entry created: ${entry.id} for engagement ${input.engagementId}`);
    return entry;
  }

  async findList(
    query: TimeEntryListQuery,
    user: JwtPayload,
  ): Promise<{ items: TimeEntry[]; meta: PaginationMeta }> {
    // Contractors can only see their own time entries
    const contractorId = user.role === 'contractor' ? user.sub : undefined;

    const { items, total } = await this.repo.findList(query, contractorId);
    const meta = buildPaginationMeta({ page: query.page, pageSize: query.pageSize }, total);

    return { items, meta };
  }

  async findById(id: string, user: JwtPayload): Promise<TimeEntry> {
    const entry = await this.repo.findById(id);
    if (!entry) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Time entry ${id} not found`,
      });
    }

    if (user.role === 'contractor' && entry.contractorId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only view your own time entries',
      });
    }

    return entry;
  }

  async update(
    id: string,
    input: UpdateTimeEntryInput,
    user: JwtPayload,
  ): Promise<TimeEntry> {
    const entry = await this.repo.findById(id);
    if (!entry) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Time entry ${id} not found`,
      });
    }

    if (entry.contractorId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only update your own time entries',
      });
    }

    const updated = await this.repo.update(id, input);
    return updated!;
  }

  async delete(id: string, user: JwtPayload): Promise<void> {
    const entry = await this.repo.findById(id);
    if (!entry) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Time entry ${id} not found`,
      });
    }

    if (entry.contractorId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only delete your own time entries',
      });
    }

    await this.repo.delete(id);
    this.logger.log(`Time entry deleted: ${id}`);
  }
}
