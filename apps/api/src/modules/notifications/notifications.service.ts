import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  Notification,
  NotificationType,
  NotificationListQuery,
  PaginationMeta,
} from '@contractor-os/shared';
import { NotificationsRepository } from './notifications.repository';
import { buildPaginationMeta } from '../../common/pagination/paginate';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly repo: NotificationsRepository) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<Notification> {
    const notification = await this.repo.create(userId, type, title, body, data);
    this.logger.log(`Notification created: ${type} for user ${userId}`);
    return notification;
  }

  async createForAdmins(
    orgId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    const adminIds = await this.repo.findAdminManagerUserIds(orgId);
    for (const userId of adminIds) {
      await this.repo.create(userId, type, title, body, data);
    }
    this.logger.log(`Notification ${type} sent to ${adminIds.length} admin/manager(s)`);
  }

  async findList(
    userId: string,
    query: NotificationListQuery,
  ): Promise<{ items: Notification[]; meta: PaginationMeta }> {
    const { items, total } = await this.repo.findByUserId(userId, {
      unreadOnly: query.unreadOnly,
      page: query.page,
      pageSize: query.pageSize,
    });

    const meta = buildPaginationMeta(
      { page: query.page, pageSize: query.pageSize },
      total,
    );

    return { items, meta };
  }

  async markRead(id: string, userId: string): Promise<void> {
    const updated = await this.repo.markRead(id, userId);
    if (!updated) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Notification ${id} not found or already read`,
      });
    }
  }

  async markAllRead(userId: string): Promise<number> {
    return this.repo.markAllRead(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.countUnread(userId);
  }

  async findContractorUserId(contractorId: string): Promise<string | null> {
    return this.repo.findUserIdByContractorId(contractorId);
  }
}
