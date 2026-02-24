import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    -- Risk level enum
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

    -- Factor category enum
    CREATE TYPE factor_category AS ENUM (
      'hours_per_week',
      'engagement_duration_weeks',
      'exclusivity_ratio',
      'set_schedule',
      'tools_provided',
      'training_provided',
      'supervision_level',
      'integration_level',
      'multiple_clients',
      'profit_loss_opportunity',
      'significant_investment'
    );

    -- Factor source enum
    CREATE TYPE factor_source AS ENUM ('computed', 'manual', 'time_entry');

    -- Classification assessments table
    CREATE TABLE classification_assessments (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      assessed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      overall_risk    risk_level NOT NULL,
      overall_score   NUMERIC(5, 2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
      irs_score       NUMERIC(5, 2) NOT NULL,
      irs_factors     JSONB NOT NULL,
      dol_score       NUMERIC(5, 2) NOT NULL,
      dol_factors     JSONB NOT NULL,
      abc_score       NUMERIC(5, 2) NOT NULL,
      abc_factors     JSONB NOT NULL,
      input_data      JSONB NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_ca_contractor ON classification_assessments(contractor_id);
    CREATE INDEX idx_ca_org_risk ON classification_assessments(organization_id, overall_risk);
    CREATE INDEX idx_ca_latest ON classification_assessments(contractor_id, assessed_at DESC);

    -- Classification factors table
    CREATE TABLE classification_factors (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id),
      category        factor_category NOT NULL,
      numeric_value   NUMERIC(10, 2),
      boolean_value   BOOLEAN,
      text_value      VARCHAR(255),
      period_start    DATE NOT NULL,
      period_end      DATE NOT NULL,
      source          factor_source NOT NULL DEFAULT 'manual',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_cf_contractor ON classification_factors(contractor_id);
    CREATE INDEX idx_cf_period ON classification_factors(contractor_id, period_start, period_end);

    -- Materialized view for dashboard performance
    CREATE MATERIALIZED VIEW mv_classification_risk_summary AS
    SELECT
      c.id AS contractor_id,
      c.organization_id,
      c.first_name || ' ' || c.last_name AS contractor_name,
      c.status AS contractor_status,
      ca.overall_risk,
      ca.overall_score,
      ca.irs_score,
      ca.dol_score,
      ca.abc_score,
      ca.assessed_at,
      COALESCE(te.avg_weekly_hours, 0) AS avg_weekly_hours,
      COALESCE(te.weeks_active, 0) AS weeks_active,
      e.engagement_count
    FROM contractors c
    LEFT JOIN LATERAL (
      SELECT overall_risk, overall_score, irs_score, dol_score, abc_score, assessed_at
      FROM classification_assessments
      WHERE contractor_id = c.id
      ORDER BY assessed_at DESC LIMIT 1
    ) ca ON true
    LEFT JOIN LATERAL (
      SELECT
        AVG(weekly_hours) AS avg_weekly_hours,
        COUNT(DISTINCT date_trunc('week', entry_date)) AS weeks_active
      FROM (
        SELECT entry_date, SUM(hours) AS weekly_hours
        FROM time_entries
        WHERE contractor_id = c.id
          AND entry_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY date_trunc('week', entry_date), entry_date
      ) weekly
    ) te ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS engagement_count
      FROM engagements
      WHERE contractor_id = c.id AND status = 'active'
    ) e ON true
    WHERE c.status = 'active';

    CREATE UNIQUE INDEX idx_mv_crs_contractor ON mv_classification_risk_summary(contractor_id);
    CREATE INDEX idx_mv_crs_org_risk ON mv_classification_risk_summary(organization_id, overall_risk);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP MATERIALIZED VIEW IF EXISTS mv_classification_risk_summary CASCADE;
    DROP TABLE IF EXISTS classification_factors CASCADE;
    DROP TABLE IF EXISTS classification_assessments CASCADE;
    DROP TYPE IF EXISTS factor_source;
    DROP TYPE IF EXISTS factor_category;
    DROP TYPE IF EXISTS risk_level;
  `);
}
