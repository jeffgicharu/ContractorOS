import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type {
  ClassificationAssessment,
  ClassificationFactor,
  ClassificationInputData,
  IrsFactorsResult,
  DolFactorsResult,
  AbcFactorsResult,
  RiskLevel,
  RiskSummaryView,
  FactorCategory,
  FactorSource,
} from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';

interface AssessmentRow {
  id: string;
  contractor_id: string;
  organization_id: string;
  assessed_at: string;
  overall_risk: string;
  overall_score: string;
  irs_score: string;
  irs_factors: IrsFactorsResult;
  dol_score: string;
  dol_factors: DolFactorsResult;
  abc_score: string;
  abc_factors: AbcFactorsResult;
  input_data: ClassificationInputData;
  created_at: string;
}

interface FactorRow {
  id: string;
  contractor_id: string;
  category: string;
  numeric_value: string | null;
  boolean_value: boolean | null;
  text_value: string | null;
  period_start: string;
  period_end: string;
  source: string;
  created_at: string;
}

interface RiskSummaryRow {
  contractor_id: string;
  organization_id: string;
  contractor_name: string;
  contractor_status: string;
  overall_risk: string | null;
  overall_score: string | null;
  irs_score: string | null;
  dol_score: string | null;
  abc_score: string | null;
  assessed_at: string | null;
  avg_weekly_hours: string;
  weeks_active: string;
  engagement_count: string;
}

interface ComputedFactorsRow {
  avg_weekly_hours: string;
  total_weeks: string;
  engagement_count: string;
}

function mapAssessmentRow(row: AssessmentRow): ClassificationAssessment {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    organizationId: row.organization_id,
    assessedAt: row.assessed_at,
    overallRisk: row.overall_risk as RiskLevel,
    overallScore: parseFloat(row.overall_score),
    irsScore: parseFloat(row.irs_score),
    irsFactors: row.irs_factors,
    dolScore: parseFloat(row.dol_score),
    dolFactors: row.dol_factors,
    abcScore: parseFloat(row.abc_score),
    abcFactors: row.abc_factors,
    inputData: row.input_data,
    createdAt: row.created_at,
  };
}

function mapFactorRow(row: FactorRow): ClassificationFactor {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    category: row.category as FactorCategory,
    numericValue: row.numeric_value !== null ? parseFloat(row.numeric_value) : null,
    booleanValue: row.boolean_value,
    textValue: row.text_value,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    source: row.source as FactorSource,
    createdAt: row.created_at,
  };
}

function mapRiskSummaryRow(row: RiskSummaryRow): RiskSummaryView {
  return {
    contractorId: row.contractor_id,
    organizationId: row.organization_id,
    contractorName: row.contractor_name,
    contractorStatus: row.contractor_status,
    overallRisk: row.overall_risk as RiskLevel | null,
    overallScore: row.overall_score !== null ? parseFloat(row.overall_score) : null,
    irsScore: row.irs_score !== null ? parseFloat(row.irs_score) : null,
    dolScore: row.dol_score !== null ? parseFloat(row.dol_score) : null,
    abcScore: row.abc_score !== null ? parseFloat(row.abc_score) : null,
    assessedAt: row.assessed_at,
    avgWeeklyHours: parseFloat(row.avg_weekly_hours),
    weeksActive: parseInt(row.weeks_active, 10),
    engagementCount: parseInt(row.engagement_count, 10),
  };
}

export interface CreateAssessmentInput {
  contractorId: string;
  organizationId: string;
  overallRisk: RiskLevel;
  overallScore: number;
  irsScore: number;
  irsFactors: IrsFactorsResult;
  dolScore: number;
  dolFactors: DolFactorsResult;
  abcScore: number;
  abcFactors: AbcFactorsResult;
  inputData: ClassificationInputData;
}

export interface CreateFactorInput {
  contractorId: string;
  category: FactorCategory;
  numericValue?: number;
  booleanValue?: boolean;
  textValue?: string;
  periodStart: string;
  periodEnd: string;
  source: FactorSource;
}

@Injectable()
export class ClassificationRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async createAssessment(input: CreateAssessmentInput): Promise<ClassificationAssessment> {
    const { rows } = await this.pool.query<AssessmentRow>(
      `INSERT INTO classification_assessments (
        contractor_id, organization_id, overall_risk, overall_score,
        irs_score, irs_factors, dol_score, dol_factors,
        abc_score, abc_factors, input_data
      ) VALUES ($1, $2, $3::risk_level, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.contractorId,
        input.organizationId,
        input.overallRisk,
        input.overallScore,
        input.irsScore,
        JSON.stringify(input.irsFactors),
        input.dolScore,
        JSON.stringify(input.dolFactors),
        input.abcScore,
        JSON.stringify(input.abcFactors),
        JSON.stringify(input.inputData),
      ],
    );
    return mapAssessmentRow(rows[0]!);
  }

  async findLatestAssessment(contractorId: string): Promise<ClassificationAssessment | null> {
    const { rows } = await this.pool.query<AssessmentRow>(
      `SELECT * FROM classification_assessments
       WHERE contractor_id = $1
       ORDER BY assessed_at DESC LIMIT 1`,
      [contractorId],
    );
    return rows[0] ? mapAssessmentRow(rows[0]) : null;
  }

  async findAssessmentHistory(
    contractorId: string,
    limit: number,
  ): Promise<ClassificationAssessment[]> {
    const { rows } = await this.pool.query<AssessmentRow>(
      `SELECT * FROM classification_assessments
       WHERE contractor_id = $1
       ORDER BY assessed_at DESC LIMIT $2`,
      [contractorId, limit],
    );
    return rows.map(mapAssessmentRow);
  }

  async findFactors(
    contractorId: string,
    category?: FactorCategory,
    source?: FactorSource,
  ): Promise<ClassificationFactor[]> {
    const conditions: string[] = ['contractor_id = $1'];
    const params: unknown[] = [contractorId];
    let paramIdx = 2;

    if (category) {
      conditions.push(`category = $${paramIdx}::factor_category`);
      params.push(category);
      paramIdx++;
    }

    if (source) {
      conditions.push(`source = $${paramIdx}::factor_source`);
      params.push(source);
    }

    const { rows } = await this.pool.query<FactorRow>(
      `SELECT * FROM classification_factors
       WHERE ${conditions.join(' AND ')}
       ORDER BY period_end DESC, created_at DESC`,
      params,
    );
    return rows.map(mapFactorRow);
  }

  async createFactor(input: CreateFactorInput): Promise<ClassificationFactor> {
    const { rows } = await this.pool.query<FactorRow>(
      `INSERT INTO classification_factors (
        contractor_id, category, numeric_value, boolean_value, text_value,
        period_start, period_end, source
      ) VALUES ($1, $2::factor_category, $3, $4, $5, $6, $7, $8::factor_source)
      RETURNING *`,
      [
        input.contractorId,
        input.category,
        input.numericValue ?? null,
        input.booleanValue ?? null,
        input.textValue ?? null,
        input.periodStart,
        input.periodEnd,
        input.source,
      ],
    );
    return mapFactorRow(rows[0]!);
  }

  async getComputedFactorsFromTimeEntries(
    contractorId: string,
  ): Promise<{ avgWeeklyHours: number; totalWeeks: number; engagementCount: number }> {
    const { rows } = await this.pool.query<ComputedFactorsRow>(
      `SELECT
        COALESCE(te.avg_weekly_hours, 0) AS avg_weekly_hours,
        COALESCE(te.total_weeks, 0) AS total_weeks,
        COALESCE(e.engagement_count, 0) AS engagement_count
      FROM (
        SELECT
          AVG(weekly_hours) AS avg_weekly_hours,
          COUNT(DISTINCT week_start) AS total_weeks
        FROM (
          SELECT
            date_trunc('week', entry_date) AS week_start,
            SUM(hours) AS weekly_hours
          FROM time_entries
          WHERE contractor_id = $1
            AND entry_date >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY date_trunc('week', entry_date)
        ) weekly
      ) te,
      (
        SELECT COUNT(*) AS engagement_count
        FROM engagements
        WHERE contractor_id = $1 AND status = 'active'
      ) e`,
      [contractorId],
    );
    return {
      avgWeeklyHours: parseFloat(rows[0]!.avg_weekly_hours),
      totalWeeks: parseInt(rows[0]!.total_weeks, 10),
      engagementCount: parseInt(rows[0]!.engagement_count, 10),
    };
  }

  async getDashboardSummary(orgId: string): Promise<{
    summary: { low: number; medium: number; high: number; critical: number };
    topRisk: RiskSummaryView[];
  }> {
    // Get counts by risk level
    const { rows: countRows } = await this.pool.query<{
      overall_risk: string | null;
      count: string;
    }>(
      `SELECT overall_risk, COUNT(*) as count
       FROM mv_classification_risk_summary
       WHERE organization_id = $1
       GROUP BY overall_risk`,
      [orgId],
    );

    const summary = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const row of countRows) {
      if (row.overall_risk && row.overall_risk in summary) {
        summary[row.overall_risk as keyof typeof summary] = parseInt(row.count, 10);
      }
    }

    // Get top 10 risk contractors
    const { rows: topRows } = await this.pool.query<RiskSummaryRow>(
      `SELECT * FROM mv_classification_risk_summary
       WHERE organization_id = $1 AND overall_score IS NOT NULL
       ORDER BY overall_score DESC
       LIMIT 10`,
      [orgId],
    );

    return {
      summary,
      topRisk: topRows.map(mapRiskSummaryRow),
    };
  }

  async refreshMaterializedView(): Promise<void> {
    await this.pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_classification_risk_summary');
  }

  async getActiveContractorIds(orgId: string): Promise<string[]> {
    const { rows } = await this.pool.query<{ id: string }>(
      `SELECT id FROM contractors WHERE organization_id = $1 AND status = 'active'`,
      [orgId],
    );
    return rows.map((r) => r.id);
  }

  async getAllOrgIds(): Promise<string[]> {
    const { rows } = await this.pool.query<{ id: string }>('SELECT id FROM organizations');
    return rows.map((r) => r.id);
  }

  async getContractorOrgId(contractorId: string): Promise<string | null> {
    const { rows } = await this.pool.query<{ organization_id: string }>(
      'SELECT organization_id FROM contractors WHERE id = $1',
      [contractorId],
    );
    return rows[0]?.organization_id ?? null;
  }
}
