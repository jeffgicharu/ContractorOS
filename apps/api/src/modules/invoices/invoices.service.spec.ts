import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesRepository } from './invoices.repository';
import { EngagementsRepository } from '../engagements/engagements.repository';
import {
  InvoiceStatus,
  EngagementStatus,
  PaymentTerms,
  type Invoice,
  type InvoiceDetail,
  type Engagement,
} from '@contractor-os/shared';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

const CONTRACTOR_ID = 'contractor-1';
const CONTRACTOR_USER_ID = 'user-contractor-1';
const OTHER_CONTRACTOR_ID = 'contractor-2';
const ENGAGEMENT_ID = 'engagement-1';
const INVOICE_ID = 'invoice-1';
const ORG_ID = 'org-1';
const ADMIN_USER_ID = 'admin-1';

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: INVOICE_ID,
    contractorId: CONTRACTOR_ID,
    engagementId: ENGAGEMENT_ID,
    organizationId: ORG_ID,
    invoiceNumber: 'INV-001',
    status: InvoiceStatus.DRAFT,
    submittedAt: null,
    approvedAt: null,
    scheduledAt: null,
    paidAt: null,
    dueDate: null,
    subtotal: 1000,
    taxAmount: 0,
    totalAmount: 1000,
    currency: 'USD',
    notes: null,
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeInvoiceDetail(overrides: Partial<InvoiceDetail> = {}): InvoiceDetail {
  return {
    id: INVOICE_ID,
    invoiceNumber: 'INV-001',
    status: InvoiceStatus.DRAFT,
    contractor: { id: CONTRACTOR_ID, name: 'John Smith' },
    engagement: { id: ENGAGEMENT_ID, title: 'Test Engagement' },
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    lineItems: [],
    subtotal: 1000,
    taxAmount: 0,
    totalAmount: 1000,
    currency: 'USD',
    dueDate: null,
    notes: null,
    approvalSteps: [],
    statusHistory: [],
    actions: [],
    submittedAt: null,
    approvedAt: null,
    paidAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeEngagement(overrides: Partial<Engagement> = {}): Engagement {
  return {
    id: ENGAGEMENT_ID,
    contractorId: CONTRACTOR_ID,
    organizationId: ORG_ID,
    title: 'Test Engagement',
    description: null,
    startDate: '2025-01-01',
    endDate: null,
    hourlyRate: 100,
    fixedRate: null,
    currency: 'USD',
    paymentTerms: PaymentTerms.NET_30,
    status: EngagementStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeUser(role: string, sub: string = CONTRACTOR_USER_ID): JwtPayload {
  return { sub, orgId: ORG_ID, role };
}

function createMockInvoicesRepo(): jest.Mocked<InvoicesRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findDetailById: jest.fn(),
    findList: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    addStatusHistory: jest.fn(),
    createApprovalStep: jest.fn(),
    updateApprovalStep: jest.fn(),
    findPendingApprovalStep: jest.fn(),
    findDuplicates: jest.fn(),
    findAdminUserIds: jest.fn(),
    findContractorByUserId: jest.fn(),
    recalculateAmountsWithClient: jest.fn(),
  } as unknown as jest.Mocked<InvoicesRepository>;
}

function createMockEngagementsRepo(): jest.Mocked<EngagementsRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByContractorId: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<EngagementsRepository>;
}

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoicesRepo: jest.Mocked<InvoicesRepository>;
  let engagementsRepo: jest.Mocked<EngagementsRepository>;

  beforeEach(() => {
    invoicesRepo = createMockInvoicesRepo();
    engagementsRepo = createMockEngagementsRepo();
    service = new InvoicesService(invoicesRepo, engagementsRepo);
    jest.clearAllMocks();

    // Default: contractor lookup resolves
    invoicesRepo.findContractorByUserId.mockResolvedValue({
      id: CONTRACTOR_ID,
      organizationId: ORG_ID,
    });
  });

  const createInput = {
    engagementId: ENGAGEMENT_ID,
    invoiceNumber: 'INV-001',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    lineItems: [{ description: 'Work done', quantity: 10, unitPrice: 100 }],
  };

  // ─── CREATE ────────────────────────────────────────────────────

  describe('create', () => {
    it('should create an invoice for an active engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(makeEngagement());
      invoicesRepo.create.mockResolvedValue(makeInvoice());

      const result = await service.create(makeUser('contractor'), createInput);

      expect(result.id).toBe(INVOICE_ID);
      expect(invoicesRepo.create).toHaveBeenCalledWith(
        ORG_ID,
        CONTRACTOR_ID,
        ENGAGEMENT_ID,
        createInput,
      );
    });

    it('should throw NotFoundException if engagement not found', async () => {
      engagementsRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(makeUser('contractor'), createInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if contractor does not own engagement', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ contractorId: OTHER_CONTRACTOR_ID }),
      );

      await expect(
        service.create(makeUser('contractor'), createInput),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if engagement is not active', async () => {
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ status: EngagementStatus.DRAFT }),
      );

      await expect(
        service.create(makeUser('contractor'), createInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── FIND LIST ─────────────────────────────────────────────────

  describe('findList', () => {
    const query = { page: 1, pageSize: 20 };

    it('should return all invoices for admin', async () => {
      invoicesRepo.findList.mockResolvedValue({ items: [], total: 0 });

      await service.findList(query, makeUser('admin', ADMIN_USER_ID));

      expect(invoicesRepo.findList).toHaveBeenCalledWith(query, ORG_ID, undefined);
    });

    it('should scope to contractor for contractor role', async () => {
      invoicesRepo.findList.mockResolvedValue({ items: [], total: 0 });

      await service.findList(query, makeUser('contractor'));

      expect(invoicesRepo.findList).toHaveBeenCalledWith(query, ORG_ID, CONTRACTOR_ID);
    });
  });

  // ─── FIND DETAIL ───────────────────────────────────────────────

  describe('findDetail', () => {
    it('should return invoice detail for admin', async () => {
      invoicesRepo.findDetailById.mockResolvedValue(makeInvoiceDetail());

      const result = await service.findDetail(INVOICE_ID, makeUser('admin', ADMIN_USER_ID));

      expect(result.id).toBe(INVOICE_ID);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      invoicesRepo.findDetailById.mockResolvedValue(null);

      await expect(
        service.findDetail('unknown', makeUser('admin', ADMIN_USER_ID)),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if contractor views another contractor\'s invoice', async () => {
      invoicesRepo.findDetailById.mockResolvedValue(
        makeInvoiceDetail({ contractor: { id: OTHER_CONTRACTOR_ID, name: 'Other' } }),
      );

      await expect(
        service.findDetail(INVOICE_ID, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should compute actions for draft invoice (contractor)', async () => {
      invoicesRepo.findDetailById.mockResolvedValue(
        makeInvoiceDetail({ status: InvoiceStatus.DRAFT }),
      );

      const result = await service.findDetail(INVOICE_ID, makeUser('contractor'));

      expect(result.actions).toContain('submit');
      expect(result.actions).toContain('edit');
      expect(result.actions).toContain('cancel');
    });

    it('should compute actions for submitted invoice (admin)', async () => {
      invoicesRepo.findDetailById.mockResolvedValue(
        makeInvoiceDetail({ status: InvoiceStatus.SUBMITTED }),
      );

      const result = await service.findDetail(INVOICE_ID, makeUser('admin', ADMIN_USER_ID));

      expect(result.actions).toContain('approve');
      expect(result.actions).toContain('reject');
    });

    it('should compute actions for approved invoice (admin)', async () => {
      invoicesRepo.findDetailById.mockResolvedValue(
        makeInvoiceDetail({ status: InvoiceStatus.APPROVED }),
      );

      const result = await service.findDetail(INVOICE_ID, makeUser('admin', ADMIN_USER_ID));

      expect(result.actions).toContain('schedule');
      expect(result.actions).toContain('dispute');
    });

    it('should compute actions for scheduled invoice (admin)', async () => {
      invoicesRepo.findDetailById.mockResolvedValue(
        makeInvoiceDetail({ status: InvoiceStatus.SCHEDULED }),
      );

      const result = await service.findDetail(INVOICE_ID, makeUser('admin', ADMIN_USER_ID));

      expect(result.actions).toContain('mark_paid');
      expect(result.actions).toContain('dispute');
    });

    it('should return empty actions for paid invoice', async () => {
      invoicesRepo.findDetailById.mockResolvedValue(
        makeInvoiceDetail({ status: InvoiceStatus.PAID }),
      );

      const result = await service.findDetail(INVOICE_ID, makeUser('admin', ADMIN_USER_ID));

      expect(result.actions).toHaveLength(0);
    });
  });

  // ─── UPDATE ────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a draft invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(makeInvoice());
      invoicesRepo.update.mockResolvedValue(makeInvoice({ notes: 'Updated' }));

      const result = await service.update(
        INVOICE_ID,
        makeUser('contractor'),
        { notes: 'Updated' },
      );

      expect(result.notes).toBe('Updated');
    });

    it('should throw BadRequestException if not draft', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.SUBMITTED }),
      );

      await expect(
        service.update(INVOICE_ID, makeUser('contractor'), { notes: 'x' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if contractor does not own invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ contractorId: OTHER_CONTRACTOR_ID }),
      );

      await expect(
        service.update(INVOICE_ID, makeUser('contractor'), { notes: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      invoicesRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('unknown', makeUser('contractor'), { notes: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── SUBMIT ────────────────────────────────────────────────────

  describe('submit', () => {
    it('should submit a draft invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(makeInvoice());
      invoicesRepo.findAdminUserIds.mockResolvedValue([ADMIN_USER_ID]);

      await service.submit(INVOICE_ID, makeUser('contractor'));

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.SUBMITTED,
        expect.objectContaining({ submitted_at: expect.any(String) }),
      );
      expect(invoicesRepo.addStatusHistory).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.DRAFT,
        InvoiceStatus.SUBMITTED,
        CONTRACTOR_USER_ID,
      );
      expect(invoicesRepo.createApprovalStep).toHaveBeenCalledWith(
        INVOICE_ID,
        ADMIN_USER_ID,
        1,
      );
    });

    it('should throw BadRequestException if not draft', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.APPROVED }),
      );

      await expect(
        service.submit(INVOICE_ID, makeUser('contractor')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if contractor does not own invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ contractorId: OTHER_CONTRACTOR_ID }),
      );

      await expect(
        service.submit(INVOICE_ID, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── APPROVE ───────────────────────────────────────────────────

  describe('approve', () => {
    it('should approve an under_review invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.UNDER_REVIEW }),
      );
      invoicesRepo.findPendingApprovalStep.mockResolvedValue({
        id: 'step-1',
        invoiceId: INVOICE_ID,
        approverId: ADMIN_USER_ID,
        stepOrder: 1,
        decision: 'pending' as const,
        decidedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      });
      engagementsRepo.findById.mockResolvedValue(makeEngagement());

      await service.approve(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), 'Looks good');

      expect(invoicesRepo.updateApprovalStep).toHaveBeenCalledWith('step-1', 'approved', 'Looks good');
      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.APPROVED,
        expect.objectContaining({
          approved_at: expect.any(String),
          due_date: expect.any(String),
        }),
      );
    });

    it('should auto-transition submitted to under_review before approving', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.SUBMITTED }),
      );
      invoicesRepo.findPendingApprovalStep.mockResolvedValue({
        id: 'step-1',
        invoiceId: INVOICE_ID,
        approverId: ADMIN_USER_ID,
        stepOrder: 1,
        decision: 'pending' as const,
        decidedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      });
      engagementsRepo.findById.mockResolvedValue(makeEngagement());

      await service.approve(INVOICE_ID, makeUser('admin', ADMIN_USER_ID));

      // Should first transition to under_review
      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.UNDER_REVIEW,
      );
      // Then approve
      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.APPROVED,
        expect.any(Object),
      );
    });

    it('should throw BadRequestException if not under_review or submitted', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.DRAFT }),
      );

      await expect(
        service.approve(INVOICE_ID, makeUser('admin', ADMIN_USER_ID)),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no pending approval step', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.UNDER_REVIEW }),
      );
      invoicesRepo.findPendingApprovalStep.mockResolvedValue(null);

      await expect(
        service.approve(INVOICE_ID, makeUser('admin', ADMIN_USER_ID)),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not the assigned approver', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.UNDER_REVIEW }),
      );
      invoicesRepo.findPendingApprovalStep.mockResolvedValue({
        id: 'step-1',
        invoiceId: INVOICE_ID,
        approverId: 'other-admin',
        stepOrder: 1,
        decision: 'pending' as const,
        decidedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      });

      await expect(
        service.approve(INVOICE_ID, makeUser('admin', ADMIN_USER_ID)),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should calculate due date based on payment terms', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.UNDER_REVIEW }),
      );
      invoicesRepo.findPendingApprovalStep.mockResolvedValue({
        id: 'step-1',
        invoiceId: INVOICE_ID,
        approverId: ADMIN_USER_ID,
        stepOrder: 1,
        decision: 'pending' as const,
        decidedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      });
      engagementsRepo.findById.mockResolvedValue(
        makeEngagement({ paymentTerms: PaymentTerms.NET_15 }),
      );

      await service.approve(INVOICE_ID, makeUser('admin', ADMIN_USER_ID));

      const updateStatusCall = invoicesRepo.updateStatus.mock.calls.find(
        (call) => call[1] === InvoiceStatus.APPROVED,
      );
      expect(updateStatusCall).toBeDefined();
      expect(updateStatusCall![2]).toHaveProperty('due_date');
    });
  });

  // ─── REJECT ────────────────────────────────────────────────────

  describe('reject', () => {
    it('should reject an under_review invoice with reason', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.UNDER_REVIEW }),
      );
      invoicesRepo.findPendingApprovalStep.mockResolvedValue({
        id: 'step-1',
        invoiceId: INVOICE_ID,
        approverId: ADMIN_USER_ID,
        stepOrder: 1,
        decision: 'pending' as const,
        decidedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      });

      await service.reject(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
        reason: 'Incorrect amounts',
      });

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.REJECTED,
      );
      expect(invoicesRepo.addStatusHistory).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.UNDER_REVIEW,
        InvoiceStatus.REJECTED,
        ADMIN_USER_ID,
        'Incorrect amounts',
      );
    });

    it('should reject a submitted invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.SUBMITTED }),
      );
      invoicesRepo.findPendingApprovalStep.mockResolvedValue(null);

      await service.reject(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
        reason: 'Missing docs',
      });

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.REJECTED,
      );
    });

    it('should throw BadRequestException if not under_review or submitted', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.DRAFT }),
      );

      await expect(
        service.reject(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
          reason: 'No',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── DISPUTE ───────────────────────────────────────────────────

  describe('dispute', () => {
    it('should dispute an approved invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.APPROVED }),
      );

      await service.dispute(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
        reason: 'Overcharged',
      });

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.DISPUTED,
      );
    });

    it('should dispute a scheduled invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.SCHEDULED }),
      );

      await service.dispute(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
        reason: 'Issue found',
      });

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.DISPUTED,
      );
    });

    it('should throw BadRequestException if status is draft', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.DRAFT }),
      );

      await expect(
        service.dispute(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
          reason: 'No',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── SCHEDULE ──────────────────────────────────────────────────

  describe('schedule', () => {
    it('should schedule an approved invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.APPROVED }),
      );

      await service.schedule(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
        paymentDate: '2026-03-01',
      });

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.SCHEDULED,
        expect.objectContaining({
          scheduled_at: expect.any(String),
          due_date: '2026-03-01',
        }),
      );
    });

    it('should throw BadRequestException if not approved', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.SUBMITTED }),
      );

      await expect(
        service.schedule(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
          paymentDate: '2026-03-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── MARK PAID ─────────────────────────────────────────────────

  describe('markPaid', () => {
    it('should mark a scheduled invoice as paid', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.SCHEDULED }),
      );

      await service.markPaid(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
        paidAt: '2026-03-01T10:00:00Z',
      });

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.PAID,
        { paid_at: '2026-03-01T10:00:00Z' },
      );
    });

    it('should throw BadRequestException if not scheduled', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.APPROVED }),
      );

      await expect(
        service.markPaid(INVOICE_ID, makeUser('admin', ADMIN_USER_ID), {
          paidAt: '2026-03-01T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── CANCEL ────────────────────────────────────────────────────

  describe('cancel', () => {
    it('should cancel a draft invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(makeInvoice());

      await service.cancel(INVOICE_ID, makeUser('contractor'));

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.CANCELLED,
      );
    });

    it('should cancel a submitted invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.SUBMITTED }),
      );

      await service.cancel(INVOICE_ID, makeUser('contractor'));

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.CANCELLED,
      );
    });

    it('should throw BadRequestException if approved', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ status: InvoiceStatus.APPROVED }),
      );

      await expect(
        service.cancel(INVOICE_ID, makeUser('contractor')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if contractor does not own invoice', async () => {
      invoicesRepo.findById.mockResolvedValue(
        makeInvoice({ contractorId: OTHER_CONTRACTOR_ID }),
      );

      await expect(
        service.cancel(INVOICE_ID, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to cancel', async () => {
      invoicesRepo.findById.mockResolvedValue(makeInvoice());

      await service.cancel(INVOICE_ID, makeUser('admin', ADMIN_USER_ID));

      expect(invoicesRepo.updateStatus).toHaveBeenCalledWith(
        INVOICE_ID,
        InvoiceStatus.CANCELLED,
      );
    });
  });

  // ─── DUPLICATE CHECK ──────────────────────────────────────────

  describe('checkDuplicates', () => {
    it('should return duplicate invoices', async () => {
      invoicesRepo.findDuplicates.mockResolvedValue([makeInvoice()]);

      const result = await service.checkDuplicates(
        makeUser('admin', ADMIN_USER_ID),
        CONTRACTOR_ID,
        '2026-01-01',
        '2026-01-31',
      );

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no duplicates', async () => {
      invoicesRepo.findDuplicates.mockResolvedValue([]);

      const result = await service.checkDuplicates(
        makeUser('admin', ADMIN_USER_ID),
        CONTRACTOR_ID,
        '2026-02-01',
        '2026-02-28',
      );

      expect(result).toHaveLength(0);
    });
  });
});
