import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type {
  Engagement,
  CreateEngagementInput,
  UpdateEngagementInput,
} from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';

interface EngagementRow {
  id: string;
  contractor_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  hourly_rate: string | null;
  fixed_rate: string | null;
  currency: string;
  payment_terms: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: EngagementRow): Engagement {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : null,
    fixedRate: row.fixed_rate ? parseFloat(row.fixed_rate) : null,
    currency: row.currency,
    paymentTerms: row.payment_terms as Engagement['paymentTerms'],
    status: row.status as Engagement['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class EngagementsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    orgId: string,
    contractorId: string,
    input: CreateEngagementInput,
  ): Promise<Engagement> {
    const { rows } = await this.pool.query<EngagementRow>(
      `INSERT INTO engagements (
        organization_id, contractor_id, title, description,
        start_date, end_date, hourly_rate, fixed_rate,
        currency, payment_terms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        orgId,
        contractorId,
        input.title,
        input.description ?? null,
        input.startDate,
        input.endDate ?? null,
        input.hourlyRate ?? null,
        input.fixedRate ?? null,
        input.currency,
        input.paymentTerms,
      ],
    );
    return mapRow(rows[0]!);
  }

  async findById(id: string): Promise<Engagement | null> {
    const { rows } = await this.pool.query<EngagementRow>(
      'SELECT * FROM engagements WHERE id = $1',
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByContractorId(
    orgId: string,
    contractorId: string,
  ): Promise<Engagement[]> {
    const { rows } = await this.pool.query<EngagementRow>(
      `SELECT * FROM engagements
       WHERE organization_id = $1 AND contractor_id = $2
       ORDER BY created_at DESC`,
      [orgId, contractorId],
    );
    return rows.map(mapRow);
  }

  async update(id: string, input: UpdateEngagementInput): Promise<Engagement | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      endDate: 'end_date',
      hourlyRate: 'hourly_rate',
      fixedRate: 'fixed_rate',
      paymentTerms: 'payment_terms',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      const value = input[key as keyof UpdateEngagementInput];
      if (value !== undefined) {
        setClauses.push(`${column} = $${paramIdx}`);
        params.push(value);
        paramIdx++;
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    params.push(id);

    const { rows } = await this.pool.query<EngagementRow>(
      `UPDATE engagements SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      params,
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.pool.query(
      'UPDATE engagements SET status = $1 WHERE id = $2',
      [status, id],
    );
  }
}
