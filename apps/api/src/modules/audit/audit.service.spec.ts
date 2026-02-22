import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import type { AuditEvent } from '@contractor-os/shared';

const ORG_ID = 'org-1';

function makeAuditEvent(overrides: Partial<AuditEvent> = {}): AuditEvent & { userEmail?: string } {
  return {
    id: 'event-1',
    organizationId: ORG_ID,
    userId: 'user-1',
    entityType: 'invoices',
    entityId: 'invoice-1',
    action: 'create',
    oldValues: null,
    newValues: { status: 'submitted' },
    ipAddress: '127.0.0.1',
    correlationId: null,
    createdAt: new Date().toISOString(),
    userEmail: 'admin@acme-corp.com',
    ...overrides,
  };
}

describe('AuditService', () => {
  let service: AuditService;
  let repo: jest.Mocked<AuditRepository>;

  beforeEach(() => {
    repo = {
      findList: jest.fn(),
    } as unknown as jest.Mocked<AuditRepository>;

    service = new AuditService(repo);
  });

  describe('findList', () => {
    it('should return paginated audit events', async () => {
      const events = [makeAuditEvent(), makeAuditEvent({ id: 'event-2' })];
      repo.findList.mockResolvedValue({ items: events, total: 2 });

      const result = await service.findList(ORG_ID, { page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(20);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should pass all filter parameters to repository', async () => {
      repo.findList.mockResolvedValue({ items: [], total: 0 });

      await service.findList(ORG_ID, {
        entityType: 'invoices',
        entityId: 'invoice-1',
        userId: 'user-1',
        action: 'approve',
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        page: 2,
        pageSize: 10,
      });

      expect(repo.findList).toHaveBeenCalledWith(ORG_ID, {
        entityType: 'invoices',
        entityId: 'invoice-1',
        userId: 'user-1',
        action: 'approve',
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        page: 2,
        pageSize: 10,
      });
    });

    it('should handle empty results', async () => {
      repo.findList.mockResolvedValue({ items: [], total: 0 });

      const result = await service.findList(ORG_ID, { page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should compute correct totalPages for partial pages', async () => {
      repo.findList.mockResolvedValue({ items: [makeAuditEvent()], total: 25 });

      const result = await service.findList(ORG_ID, { page: 1, pageSize: 10 });

      expect(result.meta.totalPages).toBe(3);
    });

    it('should pass undefined for optional filters not provided', async () => {
      repo.findList.mockResolvedValue({ items: [], total: 0 });

      await service.findList(ORG_ID, { page: 1, pageSize: 20 });

      expect(repo.findList).toHaveBeenCalledWith(ORG_ID, {
        entityType: undefined,
        entityId: undefined,
        userId: undefined,
        action: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
        pageSize: 20,
      });
    });

    it('should include userEmail in returned items', async () => {
      const event = makeAuditEvent({ id: 'e1' });
      repo.findList.mockResolvedValue({ items: [event], total: 1 });

      const result = await service.findList(ORG_ID, { page: 1, pageSize: 20 });

      expect(result.items[0]).toHaveProperty('userEmail', 'admin@acme-corp.com');
    });

    it('should return events with old and new values', async () => {
      const event = makeAuditEvent({
        oldValues: { status: 'draft' },
        newValues: { status: 'submitted' },
      });
      repo.findList.mockResolvedValue({ items: [event], total: 1 });

      const result = await service.findList(ORG_ID, { page: 1, pageSize: 20 });

      expect(result.items[0]!.oldValues).toEqual({ status: 'draft' });
      expect(result.items[0]!.newValues).toEqual({ status: 'submitted' });
    });

    it('should filter by entityType only', async () => {
      repo.findList.mockResolvedValue({ items: [], total: 0 });

      await service.findList(ORG_ID, {
        entityType: 'contractors',
        page: 1,
        pageSize: 20,
      });

      expect(repo.findList).toHaveBeenCalledWith(ORG_ID, expect.objectContaining({
        entityType: 'contractors',
        action: undefined,
      }));
    });
  });
});
