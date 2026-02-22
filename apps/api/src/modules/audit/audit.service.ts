import { Injectable } from '@nestjs/common';
import type { AuditEvent, AuditLogQuery } from '@contractor-os/shared';
import { AuditRepository } from './audit.repository';
import { buildPaginationMeta } from '../../common/pagination/paginate';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async findList(orgId: string, query: AuditLogQuery) {
    const { items, total } = await this.auditRepository.findList(orgId, {
      entityType: query.entityType,
      entityId: query.entityId,
      userId: query.userId,
      action: query.action,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      pageSize: query.pageSize,
    });

    const meta = buildPaginationMeta(
      { page: query.page, pageSize: query.pageSize },
      total,
    );

    return { items, meta };
  }
}
