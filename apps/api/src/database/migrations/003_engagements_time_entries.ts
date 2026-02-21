import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TYPE engagement_status AS ENUM (
      'draft',
      'active',
      'paused',
      'completed',
      'cancelled'
    );

    CREATE TYPE payment_terms AS ENUM (
      'net_15',
      'net_30',
      'net_45',
      'net_60'
    );

    CREATE TABLE engagements (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      title           VARCHAR(255) NOT NULL,
      description     TEXT,
      start_date      DATE NOT NULL,
      end_date        DATE,
      hourly_rate     NUMERIC(10, 2),
      fixed_rate      NUMERIC(10, 2),
      currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
      payment_terms   payment_terms NOT NULL DEFAULT 'net_30',
      status          engagement_status NOT NULL DEFAULT 'draft',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT chk_rate CHECK (hourly_rate IS NOT NULL OR fixed_rate IS NOT NULL)
    );

    CREATE INDEX idx_engagements_contractor ON engagements(contractor_id);
    CREATE INDEX idx_engagements_org ON engagements(organization_id);
    CREATE INDEX idx_engagements_active ON engagements(organization_id)
      WHERE status = 'active';

    CREATE TRIGGER trg_engagements_updated_at
      BEFORE UPDATE ON engagements
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    CREATE TABLE time_entries (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id),
      engagement_id   UUID NOT NULL REFERENCES engagements(id),
      entry_date      DATE NOT NULL,
      hours           NUMERIC(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
      description     TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_time_entries_contractor ON time_entries(contractor_id);
    CREATE INDEX idx_time_entries_engagement ON time_entries(engagement_id);
    CREATE INDEX idx_time_entries_date ON time_entries(contractor_id, entry_date);

    CREATE TRIGGER trg_time_entries_updated_at
      BEFORE UPDATE ON time_entries
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE IF EXISTS time_entries CASCADE;
    DROP TABLE IF EXISTS engagements CASCADE;
    DROP TYPE IF EXISTS payment_terms;
    DROP TYPE IF EXISTS engagement_status;
  `);
}
