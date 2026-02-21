import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type {
  TimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  TimeEntryListQuery,
} from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';
import { paginationToOffset } from '../../common/pagination/paginate';

interface TimeEntryRow {
  id: string;
  contractor_id: string;
  engagement_id: string;
  entry_date: string;
  hours: string;
  description: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    engagementId: row.engagement_id,
    entryDate: row.entry_date,
    hours: parseFloat(row.hours),
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class TimeEntriesRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    contractorId: string,
    input: CreateTimeEntryInput,
  ): Promise<TimeEntry> {
    const { rows } = await this.pool.query<TimeEntryRow>(
      `INSERT INTO time_entries (contractor_id, engagement_id, entry_date, hours, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [contractorId, input.engagementId, input.entryDate, input.hours, input.description],
    );
    return mapRow(rows[0]!);
  }

  async findById(id: string): Promise<TimeEntry | null> {
    const { rows } = await this.pool.query<TimeEntryRow>(
      'SELECT * FROM time_entries WHERE id = $1',
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findList(
    query: TimeEntryListQuery,
    contractorId?: string,
  ): Promise<{ items: TimeEntry[]; total: number }> {
    const { limit, offset } = paginationToOffset({ page: query.page, pageSize: query.pageSize });
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (contractorId) {
      conditions.push(`t.contractor_id = $${paramIdx}`);
      params.push(contractorId);
      paramIdx++;
    } else if (query.contractorId) {
      conditions.push(`t.contractor_id = $${paramIdx}`);
      params.push(query.contractorId);
      paramIdx++;
    }

    if (query.engagementId) {
      conditions.push(`t.engagement_id = $${paramIdx}`);
      params.push(query.engagementId);
      paramIdx++;
    }

    if (query.dateFrom) {
      conditions.push(`t.entry_date >= $${paramIdx}`);
      params.push(query.dateFrom);
      paramIdx++;
    }

    if (query.dateTo) {
      conditions.push(`t.entry_date <= $${paramIdx}`);
      params.push(query.dateTo);
      paramIdx++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countQuery = `SELECT COUNT(*) as total FROM time_entries t ${whereClause}`;
    const { rows: countRows } = await this.pool.query<{ total: string }>(countQuery, params);
    const total = parseInt(countRows[0]!.total, 10);

    const dataQuery = `
      SELECT t.* FROM time_entries t
      ${whereClause}
      ORDER BY t.entry_date DESC, t.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const { rows } = await this.pool.query<TimeEntryRow>(dataQuery, [...params, limit, offset]);

    return { items: rows.map(mapRow), total };
  }

  async update(id: string, input: UpdateTimeEntryInput): Promise<TimeEntry | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    const fieldMap: Record<string, string> = {
      entryDate: 'entry_date',
      hours: 'hours',
      description: 'description',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      const value = input[key as keyof UpdateTimeEntryInput];
      if (value !== undefined) {
        setClauses.push(`${column} = $${paramIdx}`);
        params.push(value);
        paramIdx++;
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    params.push(id);

    const { rows } = await this.pool.query<TimeEntryRow>(
      `UPDATE time_entries SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      params,
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM time_entries WHERE id = $1', [id]);
  }
}
