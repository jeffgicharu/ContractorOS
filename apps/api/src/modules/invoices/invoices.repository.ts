import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import type {
  Invoice,
  InvoiceListItem,
  InvoiceDetail,
  InvoiceLineItem,
  ApprovalStep,
  InvoiceStatusHistoryEntry,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceListQuery,
} from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';
import { paginationToOffset } from '../../common/pagination/paginate';

interface InvoiceRow {
  id: string;
  contractor_id: string;
  engagement_id: string;
  organization_id: string;
  invoice_number: string;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  scheduled_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  notes: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

interface LineItemRow {
  id: string;
  invoice_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
  time_entry_id: string | null;
  sort_order: number;
  created_at: string;
}

interface ApprovalStepRow {
  id: string;
  invoice_id: string;
  approver_id: string;
  approver_name?: string;
  step_order: number;
  decision: string;
  decided_at: string | null;
  notes: string | null;
  created_at: string;
}

interface StatusHistoryRow {
  id: string;
  invoice_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

function mapInvoiceRow(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    engagementId: row.engagement_id,
    organizationId: row.organization_id,
    invoiceNumber: row.invoice_number,
    status: row.status as Invoice['status'],
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    scheduledAt: row.scheduled_at,
    paidAt: row.paid_at,
    dueDate: row.due_date,
    subtotal: parseFloat(row.subtotal),
    taxAmount: parseFloat(row.tax_amount),
    totalAmount: parseFloat(row.total_amount),
    currency: row.currency,
    notes: row.notes,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLineItemRow(row: LineItemRow): InvoiceLineItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    description: row.description,
    quantity: parseFloat(row.quantity),
    unitPrice: parseFloat(row.unit_price),
    amount: parseFloat(row.amount),
    timeEntryId: row.time_entry_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapApprovalStepRow(row: ApprovalStepRow): ApprovalStep {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    approverId: row.approver_id,
    approverName: row.approver_name,
    stepOrder: row.step_order,
    decision: row.decision as ApprovalStep['decision'],
    decidedAt: row.decided_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapStatusHistoryRow(row: StatusHistoryRow): InvoiceStatusHistoryEntry {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    fromStatus: row.from_status as InvoiceStatusHistoryEntry['fromStatus'],
    toStatus: row.to_status as InvoiceStatusHistoryEntry['toStatus'],
    changedBy: row.changed_by,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

@Injectable()
export class InvoicesRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    orgId: string,
    contractorId: string,
    engagementId: string,
    input: CreateInvoiceInput,
  ): Promise<Invoice> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query<InvoiceRow>(
        `INSERT INTO invoices (
          organization_id, contractor_id, engagement_id,
          invoice_number, period_start, period_end, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [orgId, contractorId, engagementId, input.invoiceNumber, input.periodStart, input.periodEnd, input.notes ?? null],
      );

      const invoice = rows[0]!;

      // Insert line items
      for (let i = 0; i < input.lineItems.length; i++) {
        const item = input.lineItems[i]!;
        await client.query(
          `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, time_entry_id, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [invoice.id, item.description, item.quantity, item.unitPrice, item.timeEntryId ?? null, i],
        );
      }

      // Recalculate amounts
      await this.recalculateAmountsWithClient(client, invoice.id);

      // Re-fetch to get updated amounts
      const { rows: updated } = await client.query<InvoiceRow>(
        'SELECT * FROM invoices WHERE id = $1',
        [invoice.id],
      );

      await client.query('COMMIT');
      return mapInvoiceRow(updated[0]!);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Invoice | null> {
    const { rows } = await this.pool.query<InvoiceRow>(
      'SELECT * FROM invoices WHERE id = $1',
      [id],
    );
    return rows[0] ? mapInvoiceRow(rows[0]) : null;
  }

  async findDetailById(id: string): Promise<InvoiceDetail | null> {
    const { rows } = await this.pool.query<InvoiceRow & { contractor_first_name: string; contractor_last_name: string; engagement_title: string }>(
      `SELECT i.*,
        c.first_name as contractor_first_name,
        c.last_name as contractor_last_name,
        e.title as engagement_title
       FROM invoices i
       JOIN contractors c ON c.id = i.contractor_id
       JOIN engagements e ON e.id = i.engagement_id
       WHERE i.id = $1`,
      [id],
    );

    if (!rows[0]) return null;
    const row = rows[0];

    const { rows: lineItems } = await this.pool.query<LineItemRow>(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY sort_order',
      [id],
    );

    const { rows: approvalSteps } = await this.pool.query<ApprovalStepRow>(
      `SELECT a.*, u.email as approver_name
       FROM approval_steps a
       JOIN users u ON u.id = a.approver_id
       WHERE a.invoice_id = $1
       ORDER BY a.step_order`,
      [id],
    );

    const { rows: statusHistory } = await this.pool.query<StatusHistoryRow>(
      'SELECT * FROM invoice_status_history WHERE invoice_id = $1 ORDER BY created_at DESC',
      [id],
    );

    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      status: row.status as InvoiceDetail['status'],
      contractor: {
        id: row.contractor_id,
        name: `${row.contractor_first_name} ${row.contractor_last_name}`,
      },
      engagement: {
        id: row.engagement_id,
        title: row.engagement_title,
      },
      periodStart: row.period_start,
      periodEnd: row.period_end,
      lineItems: lineItems.map(mapLineItemRow),
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      totalAmount: parseFloat(row.total_amount),
      currency: row.currency,
      dueDate: row.due_date,
      notes: row.notes,
      approvalSteps: approvalSteps.map(mapApprovalStepRow),
      statusHistory: statusHistory.map(mapStatusHistoryRow),
      actions: [],
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    };
  }

  async findList(
    query: InvoiceListQuery,
    orgId: string,
    contractorId?: string,
  ): Promise<{ items: InvoiceListItem[]; total: number }> {
    const { limit, offset } = paginationToOffset({ page: query.page, pageSize: query.pageSize });
    const conditions: string[] = ['i.organization_id = $1'];
    const params: unknown[] = [orgId];
    let paramIdx = 2;

    if (contractorId) {
      conditions.push(`i.contractor_id = $${paramIdx}`);
      params.push(contractorId);
      paramIdx++;
    } else if (query.contractorId) {
      conditions.push(`i.contractor_id = $${paramIdx}`);
      params.push(query.contractorId);
      paramIdx++;
    }

    if (query.status) {
      if (query.status.includes(',')) {
        const statuses = query.status.split(',').map((s) => s.trim());
        conditions.push(`i.status = ANY($${paramIdx}::invoice_status[])`);
        params.push(statuses);
      } else {
        conditions.push(`i.status = $${paramIdx}::invoice_status`);
        params.push(query.status);
      }
      paramIdx++;
    }

    if (query.dateFrom) {
      conditions.push(`i.period_start >= $${paramIdx}`);
      params.push(query.dateFrom);
      paramIdx++;
    }

    if (query.dateTo) {
      conditions.push(`i.period_end <= $${paramIdx}`);
      params.push(query.dateTo);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM invoices i WHERE ${whereClause}`;
    const { rows: countRows } = await this.pool.query<{ total: string }>(countQuery, params);
    const total = parseInt(countRows[0]!.total, 10);

    const dataQuery = `
      SELECT i.id, i.invoice_number, i.status, i.total_amount, i.currency,
        i.due_date, i.period_start, i.period_end, i.submitted_at, i.created_at,
        c.first_name || ' ' || c.last_name as contractor_name
      FROM invoices i
      JOIN contractors c ON c.id = i.contractor_id
      WHERE ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const { rows } = await this.pool.query<{
      id: string;
      invoice_number: string;
      status: string;
      total_amount: string;
      currency: string;
      due_date: string | null;
      period_start: string;
      period_end: string;
      submitted_at: string | null;
      created_at: string;
      contractor_name: string;
    }>(dataQuery, [...params, limit, offset]);

    const items: InvoiceListItem[] = rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      status: r.status as InvoiceListItem['status'],
      contractorName: r.contractor_name,
      totalAmount: parseFloat(r.total_amount),
      currency: r.currency,
      dueDate: r.due_date,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      submittedAt: r.submitted_at,
      createdAt: r.created_at,
    }));

    return { items, total };
  }

  async update(id: string, input: UpdateInvoiceInput): Promise<Invoice | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const setClauses: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      const fieldMap: Record<string, string> = {
        invoiceNumber: 'invoice_number',
        periodStart: 'period_start',
        periodEnd: 'period_end',
        notes: 'notes',
      };

      for (const [key, column] of Object.entries(fieldMap)) {
        const value = input[key as keyof UpdateInvoiceInput];
        if (value !== undefined) {
          setClauses.push(`${column} = $${paramIdx}`);
          params.push(value);
          paramIdx++;
        }
      }

      if (setClauses.length > 0) {
        params.push(id);
        await client.query(
          `UPDATE invoices SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`,
          params,
        );
      }

      // Replace line items if provided
      if (input.lineItems) {
        await client.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);
        for (let i = 0; i < input.lineItems.length; i++) {
          const item = input.lineItems[i]!;
          await client.query(
            `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, time_entry_id, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, item.description, item.quantity, item.unitPrice, item.timeEntryId ?? null, i],
          );
        }
        await this.recalculateAmountsWithClient(client, id);
      }

      const { rows } = await client.query<InvoiceRow>(
        'SELECT * FROM invoices WHERE id = $1',
        [id],
      );

      await client.query('COMMIT');
      return rows[0] ? mapInvoiceRow(rows[0]) : null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStatus(
    id: string,
    status: string,
    timestamps?: Record<string, string>,
  ): Promise<void> {
    const setClauses = ['status = $1'];
    const params: unknown[] = [status];
    let paramIdx = 2;

    if (timestamps) {
      for (const [column, value] of Object.entries(timestamps)) {
        setClauses.push(`${column} = $${paramIdx}`);
        params.push(value);
        paramIdx++;
      }
    }

    params.push(id);
    await this.pool.query(
      `UPDATE invoices SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`,
      params,
    );
  }

  async addStatusHistory(
    invoiceId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
    reason?: string,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO invoice_status_history (invoice_id, from_status, to_status, changed_by, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [invoiceId, fromStatus, toStatus, changedBy, reason ?? null],
    );
  }

  async createApprovalStep(
    invoiceId: string,
    approverId: string,
    stepOrder: number,
  ): Promise<ApprovalStep> {
    const { rows } = await this.pool.query<ApprovalStepRow>(
      `INSERT INTO approval_steps (invoice_id, approver_id, step_order)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [invoiceId, approverId, stepOrder],
    );
    return mapApprovalStepRow(rows[0]!);
  }

  async updateApprovalStep(
    stepId: string,
    decision: string,
    notes?: string,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE approval_steps SET decision = $1, decided_at = now(), notes = $2 WHERE id = $3`,
      [decision, notes ?? null, stepId],
    );
  }

  async findPendingApprovalStep(invoiceId: string): Promise<ApprovalStep | null> {
    const { rows } = await this.pool.query<ApprovalStepRow>(
      `SELECT * FROM approval_steps WHERE invoice_id = $1 AND decision = 'pending' ORDER BY step_order LIMIT 1`,
      [invoiceId],
    );
    return rows[0] ? mapApprovalStepRow(rows[0]) : null;
  }

  async findDuplicates(
    orgId: string,
    contractorId: string,
    periodStart: string,
    periodEnd: string,
    excludeId?: string,
  ): Promise<Invoice[]> {
    const conditions = [
      'organization_id = $1',
      'contractor_id = $2',
      'period_start = $3',
      'period_end = $4',
      "status NOT IN ('cancelled', 'rejected')",
    ];
    const params: unknown[] = [orgId, contractorId, periodStart, periodEnd];

    if (excludeId) {
      conditions.push('id != $5');
      params.push(excludeId);
    }

    const { rows } = await this.pool.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE ${conditions.join(' AND ')}`,
      params,
    );
    return rows.map(mapInvoiceRow);
  }

  async findAdminUserIds(orgId: string): Promise<string[]> {
    const { rows } = await this.pool.query<{ id: string }>(
      "SELECT id FROM users WHERE organization_id = $1 AND role IN ('admin', 'manager') AND is_active = true ORDER BY role, created_at LIMIT 1",
      [orgId],
    );
    return rows.map((r) => r.id);
  }

  async findContractorByUserId(userId: string): Promise<{ id: string; organizationId: string } | null> {
    const { rows } = await this.pool.query<{ id: string; organization_id: string }>(
      'SELECT id, organization_id FROM contractors WHERE user_id = $1',
      [userId],
    );
    return rows[0] ? { id: rows[0].id, organizationId: rows[0].organization_id } : null;
  }

  private async recalculateAmountsWithClient(client: PoolClient, invoiceId: string): Promise<void> {
    const { rows } = await client.query<{ subtotal: string }>(
      'SELECT COALESCE(SUM(amount), 0) as subtotal FROM invoice_line_items WHERE invoice_id = $1',
      [invoiceId],
    );
    const subtotal = parseFloat(rows[0]!.subtotal);
    await client.query(
      'UPDATE invoices SET subtotal = $1, total_amount = $1 + tax_amount WHERE id = $2',
      [subtotal, invoiceId],
    );
  }
}
