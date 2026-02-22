import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  Invoice,
  InvoiceDetail,
  InvoiceListItem,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceListQuery,
  PaginationMeta,
  RejectInvoiceInput,
  DisputeInvoiceInput,
  ScheduleInvoiceInput,
  MarkPaidInput,
  NotificationType,
} from '@contractor-os/shared';
import {
  InvoiceStatus,
  INVOICE_TRANSITIONS,
  PAYMENT_TERMS_DAYS,
  isValidTransition,
  UserRole,
  type PaymentTerms,
} from '@contractor-os/shared';
import { InvoicesRepository } from './invoices.repository';
import { EngagementsRepository } from '../engagements/engagements.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { buildPaginationMeta } from '../../common/pagination/paginate';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly repo: InvoicesRepository,
    private readonly engagementsRepo: EngagementsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(user: JwtPayload, input: CreateInvoiceInput): Promise<Invoice> {
    const contractorId = await this.resolveContractorId(user);

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
        message: 'You can only create invoices for your own engagements',
      });
    }

    if (engagement.status !== 'active') {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Invoices can only be created for active engagements',
      });
    }

    const invoice = await this.repo.create(
      engagement.organizationId,
      contractorId,
      engagement.id,
      input,
    );
    this.logger.log(`Invoice created: ${invoice.id} (${invoice.invoiceNumber})`);
    return invoice;
  }

  async findList(
    query: InvoiceListQuery,
    user: JwtPayload,
  ): Promise<{ items: InvoiceListItem[]; meta: PaginationMeta }> {
    let contractorId: string | undefined;

    if (user.role === UserRole.CONTRACTOR) {
      contractorId = await this.resolveContractorId(user);
    }

    const { items, total } = await this.repo.findList(query, user.orgId, contractorId);
    const meta = buildPaginationMeta({ page: query.page, pageSize: query.pageSize }, total);

    return { items, meta };
  }

  async findDetail(id: string, user: JwtPayload): Promise<InvoiceDetail> {
    const detail = await this.repo.findDetailById(id);
    if (!detail) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Invoice ${id} not found`,
      });
    }

    // Contractors can only see their own invoices
    if (user.role === UserRole.CONTRACTOR) {
      const contractorId = await this.resolveContractorId(user);
      if (detail.contractor.id !== contractorId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You can only view your own invoices',
        });
      }
    }

    detail.actions = this.computeActions(detail, user);
    return detail;
  }

  async update(id: string, user: JwtPayload, input: UpdateInvoiceInput): Promise<Invoice> {
    const invoice = await this.repo.findById(id);
    if (!invoice) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Invoice ${id} not found`,
      });
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Only draft invoices can be edited',
      });
    }

    if (user.role === UserRole.CONTRACTOR) {
      const contractorId = await this.resolveContractorId(user);
      if (invoice.contractorId !== contractorId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You can only edit your own invoices',
        });
      }
    }

    const updated = await this.repo.update(id, input);
    return updated!;
  }

  // ─── State Transitions ─────────────────────────────────────────

  async submit(id: string, user: JwtPayload): Promise<void> {
    const invoice = await this.getInvoiceOrFail(id);
    this.assertTransition(invoice, InvoiceStatus.SUBMITTED);

    if (user.role === UserRole.CONTRACTOR) {
      const contractorId = await this.resolveContractorId(user);
      if (invoice.contractorId !== contractorId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You can only submit your own invoices',
        });
      }
    }

    await this.repo.updateStatus(id, InvoiceStatus.SUBMITTED, {
      submitted_at: new Date().toISOString(),
    });
    await this.repo.addStatusHistory(id, invoice.status, InvoiceStatus.SUBMITTED, user.sub);

    // Auto-create approval step for first admin/manager
    const adminIds = await this.repo.findAdminUserIds(invoice.organizationId);
    if (adminIds.length > 0) {
      await this.repo.createApprovalStep(id, adminIds[0]!, 1);
    }

    this.logger.log(`Invoice ${id}: ${invoice.status} → submitted`);

    // Notify admins/managers
    this.notificationsService.createForAdmins(
      invoice.organizationId,
      'invoice_submitted' as NotificationType,
      'Invoice Submitted',
      `Invoice ${invoice.invoiceNumber} has been submitted for review`,
      { invoiceId: id, invoiceNumber: invoice.invoiceNumber, contractorId: invoice.contractorId },
    ).catch((err) => this.logger.error('Failed to send invoice_submitted notification', err));
  }

  async approve(id: string, user: JwtPayload, notes?: string): Promise<void> {
    const invoice = await this.getInvoiceOrFail(id);

    // Allow approve from submitted or under_review
    if (invoice.status === InvoiceStatus.SUBMITTED) {
      // Auto-transition to under_review first
      await this.repo.updateStatus(id, InvoiceStatus.UNDER_REVIEW);
      await this.repo.addStatusHistory(id, invoice.status, InvoiceStatus.UNDER_REVIEW, user.sub);
    } else if (invoice.status !== InvoiceStatus.UNDER_REVIEW) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot approve invoice in ${invoice.status} status`,
      });
    }

    // Verify user is the pending approver
    const pendingStep = await this.repo.findPendingApprovalStep(id);
    if (!pendingStep) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'No pending approval step found',
      });
    }

    if (pendingStep.approverId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You are not the assigned approver for this invoice',
      });
    }

    await this.repo.updateApprovalStep(pendingStep.id, 'approved', notes);

    // Calculate due date based on engagement payment terms
    const engagement = await this.engagementsRepo.findById(invoice.engagementId);
    const now = new Date();
    let dueDate: string | undefined;
    if (engagement) {
      const days = PAYMENT_TERMS_DAYS[engagement.paymentTerms as PaymentTerms] ?? 30;
      const due = new Date(now);
      due.setDate(due.getDate() + days);
      dueDate = due.toISOString().split('T')[0]!;
    }

    const timestamps: Record<string, string> = {
      approved_at: now.toISOString(),
    };
    if (dueDate) {
      timestamps.due_date = dueDate;
    }

    await this.repo.updateStatus(id, InvoiceStatus.APPROVED, timestamps);
    await this.repo.addStatusHistory(id, InvoiceStatus.UNDER_REVIEW, InvoiceStatus.APPROVED, user.sub, notes);

    this.logger.log(`Invoice ${id}: approved (due: ${dueDate})`);

    // Notify contractor
    const contractorUserId = await this.notificationsService.findContractorUserId(invoice.contractorId);
    if (contractorUserId) {
      this.notificationsService.create(
        contractorUserId,
        'invoice_approved' as NotificationType,
        'Invoice Approved',
        `Invoice ${invoice.invoiceNumber} has been approved`,
        { invoiceId: id, invoiceNumber: invoice.invoiceNumber },
      ).catch((err) => this.logger.error('Failed to send invoice_approved notification', err));
    }
  }

  async reject(id: string, user: JwtPayload, input: RejectInvoiceInput): Promise<void> {
    const invoice = await this.getInvoiceOrFail(id);

    if (invoice.status !== InvoiceStatus.UNDER_REVIEW && invoice.status !== InvoiceStatus.SUBMITTED) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot reject invoice in ${invoice.status} status`,
      });
    }

    // Update approval step if exists
    const pendingStep = await this.repo.findPendingApprovalStep(id);
    if (pendingStep) {
      await this.repo.updateApprovalStep(pendingStep.id, 'rejected', input.reason);
    }

    await this.repo.updateStatus(id, InvoiceStatus.REJECTED);
    await this.repo.addStatusHistory(id, invoice.status, InvoiceStatus.REJECTED, user.sub, input.reason);

    this.logger.log(`Invoice ${id}: rejected — ${input.reason}`);

    // Notify contractor
    const contractorUserId = await this.notificationsService.findContractorUserId(invoice.contractorId);
    if (contractorUserId) {
      this.notificationsService.create(
        contractorUserId,
        'invoice_rejected' as NotificationType,
        'Invoice Rejected',
        `Invoice ${invoice.invoiceNumber} has been rejected: ${input.reason}`,
        { invoiceId: id, invoiceNumber: invoice.invoiceNumber, reason: input.reason },
      ).catch((err) => this.logger.error('Failed to send invoice_rejected notification', err));
    }
  }

  async dispute(id: string, user: JwtPayload, input: DisputeInvoiceInput): Promise<void> {
    const invoice = await this.getInvoiceOrFail(id);
    this.assertTransition(invoice, InvoiceStatus.DISPUTED);

    await this.repo.updateStatus(id, InvoiceStatus.DISPUTED);
    await this.repo.addStatusHistory(id, invoice.status, InvoiceStatus.DISPUTED, user.sub, input.reason);

    this.logger.log(`Invoice ${id}: disputed — ${input.reason}`);
  }

  async schedule(id: string, user: JwtPayload, input: ScheduleInvoiceInput): Promise<void> {
    const invoice = await this.getInvoiceOrFail(id);
    this.assertTransition(invoice, InvoiceStatus.SCHEDULED);

    await this.repo.updateStatus(id, InvoiceStatus.SCHEDULED, {
      scheduled_at: new Date().toISOString(),
      due_date: input.paymentDate,
    });
    await this.repo.addStatusHistory(id, invoice.status, InvoiceStatus.SCHEDULED, user.sub);

    this.logger.log(`Invoice ${id}: scheduled for ${input.paymentDate}`);
  }

  async markPaid(id: string, user: JwtPayload, input: MarkPaidInput): Promise<void> {
    const invoice = await this.getInvoiceOrFail(id);
    this.assertTransition(invoice, InvoiceStatus.PAID);

    await this.repo.updateStatus(id, InvoiceStatus.PAID, {
      paid_at: input.paidAt,
    });
    await this.repo.addStatusHistory(id, invoice.status, InvoiceStatus.PAID, user.sub, input.referenceNumber);

    this.logger.log(`Invoice ${id}: marked paid`);

    // Notify contractor
    const contractorUserId = await this.notificationsService.findContractorUserId(invoice.contractorId);
    if (contractorUserId) {
      this.notificationsService.create(
        contractorUserId,
        'invoice_paid' as NotificationType,
        'Invoice Paid',
        `Invoice ${invoice.invoiceNumber} has been paid`,
        { invoiceId: id, invoiceNumber: invoice.invoiceNumber },
      ).catch((err) => this.logger.error('Failed to send invoice_paid notification', err));
    }
  }

  async cancel(id: string, user: JwtPayload): Promise<void> {
    const invoice = await this.getInvoiceOrFail(id);
    this.assertTransition(invoice, InvoiceStatus.CANCELLED);

    if (user.role === UserRole.CONTRACTOR) {
      const contractorId = await this.resolveContractorId(user);
      if (invoice.contractorId !== contractorId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You can only cancel your own invoices',
        });
      }
    }

    await this.repo.updateStatus(id, InvoiceStatus.CANCELLED);
    await this.repo.addStatusHistory(id, invoice.status, InvoiceStatus.CANCELLED, user.sub);

    this.logger.log(`Invoice ${id}: cancelled`);
  }

  // ─── Duplicate Check ───────────────────────────────────────────

  async checkDuplicates(
    user: JwtPayload,
    contractorId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<Invoice[]> {
    return this.repo.findDuplicates(user.orgId, contractorId, periodStart, periodEnd);
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private async getInvoiceOrFail(id: string): Promise<Invoice> {
    const invoice = await this.repo.findById(id);
    if (!invoice) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Invoice ${id} not found`,
      });
    }
    return invoice;
  }

  private assertTransition(invoice: Invoice, to: InvoiceStatus): void {
    if (!isValidTransition(INVOICE_TRANSITIONS, invoice.status, to)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${invoice.status} to ${to}`,
      });
    }
  }

  private computeActions(detail: InvoiceDetail, user: JwtPayload): string[] {
    const actions: string[] = [];
    const status = detail.status;
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
    const isContractor = user.role === UserRole.CONTRACTOR;

    if (status === InvoiceStatus.DRAFT) {
      if (isContractor) {
        actions.push('edit', 'submit', 'cancel');
      }
      if (isAdmin) {
        actions.push('cancel');
      }
    }

    if (status === InvoiceStatus.SUBMITTED) {
      if (isAdmin) {
        actions.push('approve', 'reject');
      }
      if (isContractor) {
        actions.push('cancel');
      }
    }

    if (status === InvoiceStatus.UNDER_REVIEW) {
      if (isAdmin) {
        actions.push('approve', 'reject');
      }
    }

    if (status === InvoiceStatus.APPROVED) {
      if (isAdmin) {
        actions.push('schedule', 'dispute');
      }
    }

    if (status === InvoiceStatus.SCHEDULED) {
      if (isAdmin) {
        actions.push('mark_paid', 'dispute');
      }
    }

    if (status === InvoiceStatus.DISPUTED) {
      if (isAdmin) {
        actions.push('approve', 'reject');
      }
    }

    return actions;
  }

  private async resolveContractorId(user: JwtPayload): Promise<string> {
    if (user.role !== UserRole.CONTRACTOR) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Only contractors can perform this action',
      });
    }

    const contractor = await this.repo.findContractorByUserId(user.sub);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Contractor profile not found for current user',
      });
    }

    return contractor.id;
  }
}
