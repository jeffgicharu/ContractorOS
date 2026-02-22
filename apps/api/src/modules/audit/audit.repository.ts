import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { AuditEvent } from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';
import { paginationToOffset } from '../../common/pagination/paginate';

interface AuditEventRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  correlation_id: string | null;
  created_at: string;
  user_email?: string;
}

function mapRow(row: AuditEventRow): AuditEvent & { userEmail?: string } {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    oldValues: row.old_values,
    newValues: row.new_values,
    ipAddress: row.ip_address,
    correlationId: row.correlation_id,
    createdAt: row.created_at,
    ...(row.user_email ? { userEmail: row.user_email } : {}),
  };
}

@Injectable()
export class AuditRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findList(
    orgId: string,
    filters: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      action?: string;
      dateFrom?: string;
      dateTo?: string;
      page: number;
      pageSize: number;
    },
  ): Promise<{ items: (AuditEvent & { userEmail?: string })[]; total: number }> {
    const { limit, offset } = paginationToOffset({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const conditions: string[] = ['ae.organization_id = $1'];
    const params: unknown[] = [orgId];
    let paramIndex = 2;

    if (filters.entityType) {
      conditions.push(`ae.entity_type = $${paramIndex}`);
      params.push(filters.entityType);
      paramIndex++;
    }

    if (filters.entityId) {
      conditions.push(`ae.entity_id = $${paramIndex}`);
      params.push(filters.entityId);
      paramIndex++;
    }

    if (filters.userId) {
      conditions.push(`ae.user_id = $${paramIndex}`);
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters.action) {
      conditions.push(`ae.action = $${paramIndex}`);
      params.push(filters.action);
      paramIndex++;
    }

    if (filters.dateFrom) {
      conditions.push(`ae.created_at >= $${paramIndex}`);
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      conditions.push(`ae.created_at <= $${paramIndex}`);
      params.push(filters.dateTo);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM audit_events ae ${whereClause}`,
      params,
    );

    const { rows } = await this.pool.query<AuditEventRow>(
      `SELECT ae.*, u.email AS user_email
       FROM audit_events ae
       LEFT JOIN users u ON ae.user_id = u.id
       ${whereClause}
       ORDER BY ae.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
    );

    return {
      items: rows.map(mapRow),
      total: parseInt(countResult.rows[0]!.count, 10),
    };
  }
}
