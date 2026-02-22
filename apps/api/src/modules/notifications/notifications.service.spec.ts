import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import type { Notification, NotificationType } from '@contractor-os/shared';

const USER_ID = 'user-1';
const NOTIF_ID = 'notif-1';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: NOTIF_ID,
    userId: USER_ID,
    type: 'invoice_submitted' as NotificationType,
    title: 'Invoice Submitted',
    body: 'Invoice INV-001 submitted',
    data: { invoiceId: 'inv-1' },
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: jest.Mocked<NotificationsRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      countUnread: jest.fn(),
      findAdminManagerUserIds: jest.fn(),
      findUserIdByContractorId: jest.fn(),
    } as unknown as jest.Mocked<NotificationsRepository>;

    service = new NotificationsService(repo);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const notification = makeNotification();
      repo.create.mockResolvedValue(notification);

      const result = await service.create(
        USER_ID,
        'invoice_submitted' as NotificationType,
        'Invoice Submitted',
        'Invoice INV-001 submitted',
        { invoiceId: 'inv-1' },
      );

      expect(repo.create).toHaveBeenCalledWith(
        USER_ID,
        'invoice_submitted',
        'Invoice Submitted',
        'Invoice INV-001 submitted',
        { invoiceId: 'inv-1' },
      );
      expect(result).toEqual(notification);
    });
  });

  describe('createForAdmins', () => {
    it('should create notifications for all admin/manager users', async () => {
      repo.findAdminManagerUserIds.mockResolvedValue(['admin-1', 'manager-1']);
      repo.create.mockResolvedValue(makeNotification());

      await service.createForAdmins(
        'org-1',
        'invoice_submitted' as NotificationType,
        'Invoice Submitted',
        'Invoice INV-001 submitted',
        { invoiceId: 'inv-1' },
      );

      expect(repo.findAdminManagerUserIds).toHaveBeenCalledWith('org-1');
      expect(repo.create).toHaveBeenCalledTimes(2);
    });

    it('should not create notifications if no admins found', async () => {
      repo.findAdminManagerUserIds.mockResolvedValue([]);

      await service.createForAdmins(
        'org-1',
        'invoice_submitted' as NotificationType,
        'Title',
        'Body',
      );

      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('findList', () => {
    it('should return paginated notifications', async () => {
      const items = [makeNotification()];
      repo.findByUserId.mockResolvedValue({ items, total: 1 });

      const result = await service.findList(USER_ID, {
        unreadOnly: false,
        page: 1,
        pageSize: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should pass unreadOnly filter', async () => {
      repo.findByUserId.mockResolvedValue({ items: [], total: 0 });

      await service.findList(USER_ID, {
        unreadOnly: true,
        page: 1,
        pageSize: 10,
      });

      expect(repo.findByUserId).toHaveBeenCalledWith(USER_ID, {
        unreadOnly: true,
        page: 1,
        pageSize: 10,
      });
    });

    it('should calculate correct total pages', async () => {
      repo.findByUserId.mockResolvedValue({ items: [], total: 45 });

      const result = await service.findList(USER_ID, {
        unreadOnly: false,
        page: 1,
        pageSize: 20,
      });

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('markRead', () => {
    it('should mark notification as read', async () => {
      repo.markRead.mockResolvedValue(true);

      await service.markRead(NOTIF_ID, USER_ID);

      expect(repo.markRead).toHaveBeenCalledWith(NOTIF_ID, USER_ID);
    });

    it('should throw NotFoundException if not found', async () => {
      repo.markRead.mockResolvedValue(false);

      await expect(
        service.markRead('non-existent', USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read', async () => {
      repo.markAllRead.mockResolvedValue(5);

      const count = await service.markAllRead(USER_ID);

      expect(repo.markAllRead).toHaveBeenCalledWith(USER_ID);
      expect(count).toBe(5);
    });

    it('should return 0 when no unread notifications', async () => {
      repo.markAllRead.mockResolvedValue(0);

      const count = await service.markAllRead(USER_ID);
      expect(count).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      repo.countUnread.mockResolvedValue(3);

      const count = await service.getUnreadCount(USER_ID);

      expect(repo.countUnread).toHaveBeenCalledWith(USER_ID);
      expect(count).toBe(3);
    });
  });

  describe('findContractorUserId', () => {
    it('should return user ID for contractor', async () => {
      repo.findUserIdByContractorId.mockResolvedValue('user-1');

      const result = await service.findContractorUserId('contractor-1');
      expect(result).toBe('user-1');
    });

    it('should return null if contractor has no user', async () => {
      repo.findUserIdByContractorId.mockResolvedValue(null);

      const result = await service.findContractorUserId('contractor-2');
      expect(result).toBeNull();
    });
  });
});
