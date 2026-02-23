import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.module';

export interface MonthlyRevenue {
  month: string; // 'YYYY-MM'
  label: string; // 'Jan', 'Feb', etc.
  total: number;
  count: number;
}

export interface InvoiceStatusCount {
  status: string;
  count: number;
}

export interface ContractorStatusCount {
  status: string;
  count: number;
}

export interface MonthlyContractorGrowth {
  month: string;
  label: string;
  total: number;
}

@Injectable()
export class DashboardRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getMonthlyRevenue(orgId: string, months: number): Promise<MonthlyRevenue[]> {
    const { rows } = await this.pool.query<{
      month: string;
      month_label: string;
      total: string;
      count: string;
    }>(
      `SELECT
         to_char(date_trunc('month', i.paid_at), 'YYYY-MM') AS month,
         to_char(date_trunc('month', i.paid_at), 'Mon') AS month_label,
         COALESCE(SUM(i.total_amount), 0) AS total,
         COUNT(*)::text AS count
       FROM invoices i
       JOIN contractors c ON i.contractor_id = c.id
       WHERE c.organization_id = $1
         AND i.status = 'paid'
         AND i.paid_at >= date_trunc('month', now()) - interval '${months - 1} months'
       GROUP BY date_trunc('month', i.paid_at)
       ORDER BY month ASC`,
      [orgId],
    );

    return rows.map((r) => ({
      month: r.month,
      label: r.month_label,
      total: parseFloat(r.total),
      count: parseInt(r.count, 10),
    }));
  }

  async getInvoiceStatusBreakdown(orgId: string): Promise<InvoiceStatusCount[]> {
    const { rows } = await this.pool.query<{ status: string; count: string }>(
      `SELECT i.status, COUNT(*)::text AS count
       FROM invoices i
       JOIN contractors c ON i.contractor_id = c.id
       WHERE c.organization_id = $1
       GROUP BY i.status
       ORDER BY count DESC`,
      [orgId],
    );

    return rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  async getContractorStatusBreakdown(orgId: string): Promise<ContractorStatusCount[]> {
    const { rows } = await this.pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text AS count
       FROM contractors
       WHERE organization_id = $1
       GROUP BY status
       ORDER BY count DESC`,
      [orgId],
    );

    return rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  async getMonthlyContractorGrowth(orgId: string, months: number): Promise<MonthlyContractorGrowth[]> {
    const { rows } = await this.pool.query<{
      month: string;
      month_label: string;
      total: string;
    }>(
      `SELECT
         to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
         to_char(date_trunc('month', created_at), 'Mon') AS month_label,
         COUNT(*)::text AS total
       FROM contractors
       WHERE organization_id = $1
         AND created_at >= date_trunc('month', now()) - interval '${months - 1} months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY month ASC`,
      [orgId],
    );

    return rows.map((r) => ({
      month: r.month,
      label: r.month_label,
      total: parseInt(r.total, 10),
    }));
  }

  async findContractorIdByUserId(userId: string): Promise<string | null> {
    const { rows } = await this.pool.query<{ id: string }>(
      'SELECT id FROM contractors WHERE user_id = $1',
      [userId],
    );
    return rows[0]?.id ?? null;
  }

  async getContractorMonthlyEarnings(
    contractorId: string,
    months: number,
  ): Promise<MonthlyRevenue[]> {
    const { rows } = await this.pool.query<{
      month: string;
      month_label: string;
      total: string;
      count: string;
    }>(
      `SELECT
         to_char(date_trunc('month', i.paid_at), 'YYYY-MM') AS month,
         to_char(date_trunc('month', i.paid_at), 'Mon') AS month_label,
         COALESCE(SUM(i.total_amount), 0) AS total,
         COUNT(*)::text AS count
       FROM invoices i
       WHERE i.contractor_id = $1
         AND i.status = 'paid'
         AND i.paid_at >= date_trunc('month', now()) - interval '${months - 1} months'
       GROUP BY date_trunc('month', i.paid_at)
       ORDER BY month ASC`,
      [contractorId],
    );

    return rows.map((r) => ({
      month: r.month,
      label: r.month_label,
      total: parseFloat(r.total),
      count: parseInt(r.count, 10),
    }));
  }
}
