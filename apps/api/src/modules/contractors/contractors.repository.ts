import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type {
  ContractorListItem,
  ContractorDetail,
  ContractorListQuery,
  CreateContractorInput,
  UpdateContractorInput,
} from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';
import { paginationToOffset } from '../../common/pagination/paginate';

interface ContractorRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  type: string;
  invite_token: string | null;
  invite_expires_at: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  tin_last_four: string | null;
  bank_name: string | null;
  bank_routing: string | null;
  bank_account_last_four: string | null;
  bank_verified: boolean;
  activated_at: string | null;
  offboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  created_at: 'c.created_at',
  first_name: 'c.first_name',
  last_name: 'c.last_name',
  status: 'c.status',
  email: 'c.email',
};

@Injectable()
export class ContractorsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    orgId: string,
    input: CreateContractorInput,
    inviteToken: string,
    inviteExpiresAt: Date,
  ): Promise<ContractorRow> {
    const { rows } = await this.pool.query<ContractorRow>(
      `INSERT INTO contractors (organization_id, email, first_name, last_name, type, invite_token, invite_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [orgId, input.email, input.firstName, input.lastName, input.type, inviteToken, inviteExpiresAt.toISOString()],
    );
    return rows[0]!;
  }

  async findById(orgId: string, id: string): Promise<ContractorRow | null> {
    const { rows } = await this.pool.query<ContractorRow>(
      'SELECT * FROM contractors WHERE id = $1 AND organization_id = $2',
      [id, orgId],
    );
    return rows[0] ?? null;
  }

  async findList(
    orgId: string,
    query: ContractorListQuery,
  ): Promise<{ items: ContractorListItem[]; total: number }> {
    const { limit, offset } = paginationToOffset({ page: query.page, pageSize: query.pageSize });
    const conditions: string[] = ['c.organization_id = $1'];
    const params: unknown[] = [orgId];
    let paramIdx = 2;

    if (query.status) {
      if (query.status.includes(',')) {
        const statuses = query.status.split(',').map((s) => s.trim());
        conditions.push(`c.status = ANY($${paramIdx}::contractor_status[])`);
        params.push(statuses);
      } else {
        conditions.push(`c.status = $${paramIdx}`);
        params.push(query.status);
      }
      paramIdx++;
    }

    if (query.search) {
      conditions.push(`c.search_vector @@ plainto_tsquery('english', $${paramIdx})`);
      params.push(query.search);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');
    const sortColumn = ALLOWED_SORT_COLUMNS[query.sortBy] ?? 'c.created_at';
    const sortDir = query.sortDir === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) as total FROM contractors c WHERE ${whereClause}`;
    const { rows: countRows } = await this.pool.query<{ total: string }>(countQuery, params);
    const total = parseInt(countRows[0]!.total, 10);

    const dataQuery = `
      SELECT c.id, c.email, c.first_name, c.last_name, c.status, c.type, c.activated_at, c.created_at
      FROM contractors c
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortDir}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const { rows } = await this.pool.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      status: string;
      type: string;
      activated_at: string | null;
      created_at: string;
    }>(dataQuery, [...params, limit, offset]);

    const items: ContractorListItem[] = rows.map((r) => ({
      id: r.id,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      status: r.status as ContractorListItem['status'],
      type: r.type as ContractorListItem['type'],
      activatedAt: r.activated_at,
      createdAt: r.created_at,
    }));

    return { items, total };
  }

  async findDetailById(orgId: string, id: string): Promise<ContractorDetail | null> {
    const contractor = await this.findById(orgId, id);
    if (!contractor) return null;

    // Onboarding steps
    const { rows: stepRows } = await this.pool.query<{
      id: string;
      step_type: string;
      status: string;
      completed_at: string | null;
      data: Record<string, unknown>;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT id, step_type, status, completed_at, data, created_at, updated_at FROM onboarding_steps WHERE contractor_id = $1 ORDER BY created_at',
      [id],
    );

    const steps = stepRows.map((s) => ({
      id: s.id,
      contractorId: id,
      stepType: s.step_type as ContractorDetail['onboarding']['steps'][number]['stepType'],
      status: s.status as ContractorDetail['onboarding']['steps'][number]['status'],
      completedAt: s.completed_at,
      data: s.data,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    const completedSteps = steps.filter((s) => s.status === 'completed').length;

    // Latest risk assessment (may not exist yet in Phase 1)
    const { rows: riskRows } = await this.pool.query<{
      overall_risk: string;
      overall_score: string;
      assessed_at: string;
    }>(
      `SELECT overall_risk, overall_score, assessed_at
       FROM classification_assessments
       WHERE contractor_id = $1
       ORDER BY assessed_at DESC LIMIT 1`,
      [id],
    ).catch(() => ({ rows: [] as never[] }));

    const riskRow = riskRows[0];
    const latestRiskAssessment = riskRow
      ? {
          overallRisk: riskRow.overall_risk as NonNullable<ContractorDetail['latestRiskAssessment']>['overallRisk'],
          overallScore: parseFloat(riskRow.overall_score),
          assessedAt: riskRow.assessed_at,
        }
      : null;

    // Active engagements count
    const { rows: engRows } = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM engagements WHERE contractor_id = $1 AND status = 'active'",
      [id],
    );

    // Document status (may not exist yet in Phase 1)
    const { rows: docRows } = await this.pool.query<{
      has_w9: boolean;
      has_contract: boolean;
      expiring: string;
    }>(
      `SELECT
        EXISTS(SELECT 1 FROM tax_documents WHERE contractor_id = $1 AND document_type = 'w9' AND is_current = true) as has_w9,
        EXISTS(SELECT 1 FROM tax_documents WHERE contractor_id = $1 AND document_type = 'contract' AND is_current = true) as has_contract,
        COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < now() + INTERVAL '30 days') as expiring
       FROM tax_documents WHERE contractor_id = $1 AND is_current = true`,
      [id],
    ).catch(() => ({ rows: [{ has_w9: false, has_contract: false, expiring: '0' }] }));

    // YTD payments (may not exist yet in Phase 1)
    const { rows: payRows } = await this.pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM invoices
       WHERE contractor_id = $1 AND status = 'paid'
         AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM now())`,
      [id],
    ).catch(() => ({ rows: [{ total: '0' }] }));

    const doc = docRows[0] ?? { has_w9: false, has_contract: false, expiring: '0' };

    return {
      id: contractor.id,
      email: contractor.email,
      firstName: contractor.first_name,
      lastName: contractor.last_name,
      status: contractor.status as ContractorDetail['status'],
      type: contractor.type as ContractorDetail['type'],
      activatedAt: contractor.activated_at,
      onboarding: {
        completedSteps,
        totalSteps: 4,
        steps,
      },
      latestRiskAssessment,
      activeEngagements: parseInt(engRows[0]?.count ?? '0', 10),
      documentStatus: {
        hasCurrentW9: doc.has_w9,
        hasCurrentContract: doc.has_contract,
        expiringDocuments: parseInt(String(doc.expiring), 10),
      },
      ytdPayments: parseFloat(payRows[0]?.total ?? '0'),
      createdAt: contractor.created_at,
    };
  }

  async update(orgId: string, id: string, input: UpdateContractorInput): Promise<ContractorRow | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      phone: 'phone',
      addressLine1: 'address_line1',
      addressLine2: 'address_line2',
      city: 'city',
      state: 'state',
      zipCode: 'zip_code',
      country: 'country',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      const value = input[key as keyof UpdateContractorInput];
      if (value !== undefined) {
        setClauses.push(`${column} = $${paramIdx}`);
        params.push(value);
        paramIdx++;
      }
    }

    if (setClauses.length === 0) return this.findById(orgId, id);

    params.push(id, orgId);

    const { rows } = await this.pool.query<ContractorRow>(
      `UPDATE contractors SET ${setClauses.join(', ')} WHERE id = $${paramIdx} AND organization_id = $${paramIdx + 1} RETURNING *`,
      params,
    );

    return rows[0] ?? null;
  }

  async updateStatus(
    id: string,
    status: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Close previous status history entry
      await client.query(
        `UPDATE contractor_status_history
         SET effective_until = now()
         WHERE contractor_id = $1 AND effective_until IS NULL`,
        [id],
      );

      // Insert new status history
      await client.query(
        `INSERT INTO contractor_status_history (contractor_id, status, changed_by, reason)
         VALUES ($1, $2, $3, $4)`,
        [id, status, userId, reason ?? null],
      );

      // Update contractor status
      const extraSets = status === 'active'
        ? ', activated_at = now()'
        : status === 'offboarded'
          ? ', offboarded_at = now()'
          : '';

      await client.query(
        `UPDATE contractors SET status = $1${extraSets} WHERE id = $2`,
        [status, id],
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateInviteToken(id: string, inviteToken: string, expiresAt: Date): Promise<void> {
    await this.pool.query(
      `UPDATE contractors SET invite_token = $1, invite_expires_at = $2 WHERE id = $3`,
      [inviteToken, expiresAt.toISOString(), id],
    );
  }

  async existsByEmail(orgId: string, email: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM contractors WHERE organization_id = $1 AND email = $2) as exists',
      [orgId, email],
    );
    return rows[0]!.exists;
  }
}
