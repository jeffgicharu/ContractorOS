import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TYPE onboarding_step_type AS ENUM (
      'invite_accepted',
      'tax_form_submitted',
      'contract_signed',
      'bank_details_submitted'
    );

    CREATE TYPE step_status AS ENUM ('pending', 'completed', 'skipped');

    CREATE TABLE onboarding_steps (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
      step_type       onboarding_step_type NOT NULL,
      status          step_status NOT NULL DEFAULT 'pending',
      completed_at    TIMESTAMPTZ,
      data            JSONB NOT NULL DEFAULT '{}',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (contractor_id, step_type)
    );

    CREATE INDEX idx_onboarding_contractor ON onboarding_steps(contractor_id);

    CREATE TRIGGER trg_onboarding_steps_updated_at
      BEFORE UPDATE ON onboarding_steps
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE IF EXISTS onboarding_steps CASCADE;
    DROP TYPE IF EXISTS step_status;
    DROP TYPE IF EXISTS onboarding_step_type;
  `);
}
