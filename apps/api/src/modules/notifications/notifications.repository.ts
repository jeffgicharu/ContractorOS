import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { Notification, NotificationType } from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';
import { paginationToOffset } from '../../common/pagination/paginate';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    data: row.data,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<Notification> {
    const { rows } = await this.pool.query<NotificationRow>(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2::notification_type, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, body, JSON.stringify(data)],
    );
    return mapRow(rows[0]!);
  }

  async findByUserId(
    userId: string,
    options: { unreadOnly: boolean; page: number; pageSize: number },
  ): Promise<{ items: Notification[]; total: number }> {
    const { limit, offset } = paginationToOffset({
      page: options.page,
      pageSize: options.pageSize,
    });

    const whereClause = options.unreadOnly
      ? 'WHERE user_id = $1 AND read_at IS NULL'
      : 'WHERE user_id = $1';

    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM notifications ${whereClause}`,
      [userId],
    );

    const { rows } = await this.pool.query<NotificationRow>(
      `SELECT * FROM notifications ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    return {
      items: rows.map(mapRow),
      total: parseInt(countResult.rows[0]!.count, 10),
    };
  }

  async markRead(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `UPDATE notifications SET read_at = now()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
      [id, userId],
    );
    return (rowCount ?? 0) > 0;
  }

  async markAllRead(userId: string): Promise<number> {
    const { rowCount } = await this.pool.query(
      `UPDATE notifications SET read_at = now()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId],
    );
    return rowCount ?? 0;
  }

  async countUnread(userId: string): Promise<number> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [userId],
    );
    return parseInt(rows[0]!.count, 10);
  }

  async findAdminManagerUserIds(orgId: string): Promise<string[]> {
    const { rows } = await this.pool.query<{ id: string }>(
      `SELECT id FROM users
       WHERE organization_id = $1 AND role IN ('admin', 'manager') AND is_active = true`,
      [orgId],
    );
    return rows.map((r) => r.id);
  }

  async findUserIdByContractorId(contractorId: string): Promise<string | null> {
    const { rows } = await this.pool.query<{ user_id: string }>(
      `SELECT user_id FROM contractors WHERE id = $1 AND user_id IS NOT NULL`,
      [contractorId],
    );
    return rows[0]?.user_id ?? null;
  }
}
