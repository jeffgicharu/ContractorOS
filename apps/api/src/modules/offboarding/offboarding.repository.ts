import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type {
  OffboardingWorkflow,
  OffboardingWorkflowDetail,
  OffboardingChecklistItem,
  Equipment,
} from '@contractor-os/shared';
import type {
  OffboardingStatus,
  ChecklistStatus,
  ChecklistItemType,
  OffboardingReason,
  EquipmentStatus,
} from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';

interface WorkflowRow {
  id: string;
  contractor_id: string;
  organization_id: string;
  initiated_by: string;
  reason: string;
  effective_date: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowDetailRow extends WorkflowRow {
  contractor_name: string;
  initiated_by_name: string;
}

interface ChecklistRow {
  id: string;
  workflow_id: string;
  item_type: string;
  status: string;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EquipmentRow {
  id: string;
  contractor_id: string;
  organization_id: string;
  description: string;
  serial_number: string | null;
  assigned_at: string;
  return_requested_at: string | null;
  returned_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapWorkflowRow(row: WorkflowRow): OffboardingWorkflow {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    organizationId: row.organization_id,
    initiatedBy: row.initiated_by,
    reason: row.reason as OffboardingReason,
    effectiveDate: row.effective_date,
    status: row.status as OffboardingStatus,
    notes: row.notes,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChecklistRow(row: ChecklistRow): OffboardingChecklistItem {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    itemType: row.item_type as ChecklistItemType,
    status: row.status as ChecklistStatus,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEquipmentRow(row: EquipmentRow): Equipment {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    organizationId: row.organization_id,
    description: row.description,
    serialNumber: row.serial_number,
    assignedAt: row.assigned_at,
    returnRequestedAt: row.return_requested_at,
    returnedAt: row.returned_at,
    status: row.status as EquipmentStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class OffboardingRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async createWorkflow(data: {
    contractorId: string;
    organizationId: string;
    initiatedBy: string;
    reason: OffboardingReason;
    effectiveDate: string;
    notes?: string;
  }): Promise<OffboardingWorkflow> {
    const { rows } = await this.pool.query<WorkflowRow>(
      `INSERT INTO offboarding_workflows (
        contractor_id, organization_id, initiated_by, reason, effective_date, notes
      ) VALUES ($1, $2, $3, $4::offboarding_reason, $5, $6)
      RETURNING *`,
      [
        data.contractorId,
        data.organizationId,
        data.initiatedBy,
        data.reason,
        data.effectiveDate,
        data.notes ?? null,
      ],
    );
    return mapWorkflowRow(rows[0]!);
  }

  async findWorkflowById(id: string): Promise<OffboardingWorkflowDetail | null> {
    const { rows } = await this.pool.query<WorkflowDetailRow>(
      `SELECT w.*,
        c.first_name || ' ' || c.last_name AS contractor_name,
        u.first_name || ' ' || u.last_name AS initiated_by_name
      FROM offboarding_workflows w
      JOIN contractors c ON c.id = w.contractor_id
      JOIN users u ON u.id = w.initiated_by
      WHERE w.id = $1`,
      [id],
    );
    if (!rows[0]) return null;

    const checklistItems = await this.findChecklistItems(id);
    const equipment = await this.findEquipmentByContractorId(rows[0].contractor_id);

    return {
      ...mapWorkflowRow(rows[0]),
      contractorName: rows[0].contractor_name,
      initiatedByName: rows[0].initiated_by_name,
      checklistItems,
      equipment,
    };
  }

  async findActiveWorkflowByContractorId(contractorId: string): Promise<OffboardingWorkflow | null> {
    const { rows } = await this.pool.query<WorkflowRow>(
      `SELECT * FROM offboarding_workflows
       WHERE contractor_id = $1
         AND status NOT IN ('completed', 'cancelled')
       ORDER BY created_at DESC LIMIT 1`,
      [contractorId],
    );
    return rows[0] ? mapWorkflowRow(rows[0]) : null;
  }

  async findWorkflows(
    orgId: string,
    filters: { status?: OffboardingStatus; page: number; limit: number },
  ): Promise<{ items: (OffboardingWorkflow & { contractorName: string; progress: number })[]; total: number }> {
    const conditions: string[] = ['w.organization_id = $1'];
    const params: unknown[] = [orgId];
    let paramIdx = 2;

    if (filters.status) {
      conditions.push(`w.status = $${paramIdx}::offboarding_status`);
      params.push(filters.status);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const { rows: countRows } = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) as total FROM offboarding_workflows w WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countRows[0]!.total, 10);

    const offset = (filters.page - 1) * filters.limit;

    const { rows } = await this.pool.query<WorkflowDetailRow & { progress: string }>(
      `SELECT w.*,
        c.first_name || ' ' || c.last_name AS contractor_name,
        u.first_name || ' ' || u.last_name AS initiated_by_name,
        COALESCE(
          CASE
            WHEN COUNT(ci.id) FILTER (WHERE ci.status != 'not_applicable') = 0 THEN 0
            ELSE ROUND(
              COUNT(ci.id) FILTER (WHERE ci.status = 'completed')::numeric /
              NULLIF(COUNT(ci.id) FILTER (WHERE ci.status != 'not_applicable'), 0) * 100
            )
          END, 0
        ) AS progress
      FROM offboarding_workflows w
      JOIN contractors c ON c.id = w.contractor_id
      JOIN users u ON u.id = w.initiated_by
      LEFT JOIN offboarding_checklist_items ci ON ci.workflow_id = w.id
      WHERE ${whereClause}
      GROUP BY w.id, c.first_name, c.last_name, u.first_name, u.last_name
      ORDER BY w.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, filters.limit, offset],
    );

    const items = rows.map((row) => ({
      ...mapWorkflowRow(row),
      contractorName: row.contractor_name,
      progress: parseInt(row.progress, 10),
    }));

    return { items, total };
  }

  async updateWorkflowStatus(
    id: string,
    status: OffboardingStatus,
    completedAt?: string,
  ): Promise<void> {
    if (completedAt) {
      await this.pool.query(
        `UPDATE offboarding_workflows
         SET status = $1::offboarding_status, completed_at = $2, updated_at = now()
         WHERE id = $3`,
        [status, completedAt, id],
      );
    } else {
      await this.pool.query(
        `UPDATE offboarding_workflows
         SET status = $1::offboarding_status, updated_at = now()
         WHERE id = $2`,
        [status, id],
      );
    }
  }

  async updateWorkflowNotes(id: string, notes: string): Promise<void> {
    await this.pool.query(
      'UPDATE offboarding_workflows SET notes = $1, updated_at = now() WHERE id = $2',
      [notes, id],
    );
  }

  async createChecklistItems(
    workflowId: string,
    items: { itemType: ChecklistItemType; status: ChecklistStatus }[],
  ): Promise<OffboardingChecklistItem[]> {
    const results: OffboardingChecklistItem[] = [];
    for (const item of items) {
      const { rows } = await this.pool.query<ChecklistRow>(
        `INSERT INTO offboarding_checklist_items (workflow_id, item_type, status)
         VALUES ($1, $2::checklist_item_type, $3::checklist_status)
         RETURNING *`,
        [workflowId, item.itemType, item.status],
      );
      results.push(mapChecklistRow(rows[0]!));
    }
    return results;
  }

  async findChecklistItems(workflowId: string): Promise<OffboardingChecklistItem[]> {
    const { rows } = await this.pool.query<ChecklistRow>(
      'SELECT * FROM offboarding_checklist_items WHERE workflow_id = $1 ORDER BY created_at',
      [workflowId],
    );
    return rows.map(mapChecklistRow);
  }

  async findChecklistItemById(itemId: string): Promise<OffboardingChecklistItem | null> {
    const { rows } = await this.pool.query<ChecklistRow>(
      'SELECT * FROM offboarding_checklist_items WHERE id = $1',
      [itemId],
    );
    return rows[0] ? mapChecklistRow(rows[0]) : null;
  }

  async updateChecklistItem(
    itemId: string,
    data: { status: ChecklistStatus; completedBy?: string; notes?: string },
  ): Promise<OffboardingChecklistItem> {
    const completedAt = data.status === 'completed' ? new Date().toISOString() : null;
    const completedBy = data.status === 'completed' ? (data.completedBy ?? null) : null;

    const { rows } = await this.pool.query<ChecklistRow>(
      `UPDATE offboarding_checklist_items
       SET status = $1::checklist_status, completed_by = $2, completed_at = $3, notes = COALESCE($4, notes), updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [data.status, completedBy, completedAt, data.notes ?? null, itemId],
    );
    return mapChecklistRow(rows[0]!);
  }

  async findEquipmentByContractorId(contractorId: string): Promise<Equipment[]> {
    const { rows } = await this.pool.query<EquipmentRow>(
      'SELECT * FROM equipment WHERE contractor_id = $1 ORDER BY created_at',
      [contractorId],
    );
    return rows.map(mapEquipmentRow);
  }

  async createEquipment(data: {
    contractorId: string;
    organizationId: string;
    description: string;
    serialNumber?: string;
    notes?: string;
  }): Promise<Equipment> {
    const { rows } = await this.pool.query<EquipmentRow>(
      `INSERT INTO equipment (contractor_id, organization_id, description, serial_number, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.contractorId, data.organizationId, data.description, data.serialNumber ?? null, data.notes ?? null],
    );
    return mapEquipmentRow(rows[0]!);
  }

  async updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<void> {
    const extraSets = status === 'returned'
      ? ', returned_at = now()'
      : status === 'return_requested'
        ? ', return_requested_at = now()'
        : '';

    await this.pool.query(
      `UPDATE equipment SET status = $1::equipment_status${extraSets}, updated_at = now() WHERE id = $2`,
      [status, id],
    );
  }

  async countPendingInvoices(contractorId: string): Promise<number> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM invoices
       WHERE contractor_id = $1
         AND status NOT IN ('paid', 'rejected', 'cancelled')`,
      [contractorId],
    );
    return parseInt(rows[0]!.count, 10);
  }

  async getChecklistProgress(workflowId: string): Promise<{ completed: number; total: number }> {
    const { rows } = await this.pool.query<{ completed: string; total: string }>(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status != 'not_applicable') AS total
       FROM offboarding_checklist_items
       WHERE workflow_id = $1`,
      [workflowId],
    );
    return {
      completed: parseInt(rows[0]!.completed, 10),
      total: parseInt(rows[0]!.total, 10),
    };
  }
}
