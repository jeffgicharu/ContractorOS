import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    -- Offboarding status enum
    CREATE TYPE offboarding_status AS ENUM (
      'initiated', 'in_progress', 'pending_final_invoice', 'completed', 'cancelled'
    );

    -- Offboarding reason enum
    CREATE TYPE offboarding_reason AS ENUM (
      'project_completed', 'budget_cut', 'performance', 'mutual_agreement', 'compliance_risk', 'other'
    );

    -- Checklist item type enum
    CREATE TYPE checklist_item_type AS ENUM (
      'revoke_system_access',
      'revoke_code_repo_access',
      'revoke_communication_tools',
      'retrieve_equipment',
      'process_final_invoice',
      'archive_documents',
      'freeze_tax_data',
      'exit_interview',
      'remove_from_tools'
    );

    -- Checklist status enum
    CREATE TYPE checklist_status AS ENUM ('pending', 'completed', 'skipped', 'not_applicable');

    -- Equipment status enum
    CREATE TYPE equipment_status AS ENUM ('assigned', 'return_requested', 'returned', 'lost');

    -- Offboarding workflows table
    CREATE TABLE offboarding_workflows (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      initiated_by    UUID NOT NULL REFERENCES users(id),
      reason          offboarding_reason NOT NULL,
      effective_date  DATE NOT NULL,
      status          offboarding_status NOT NULL DEFAULT 'initiated',
      notes           TEXT,
      completed_at    TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_ow_contractor ON offboarding_workflows(contractor_id);
    CREATE INDEX idx_ow_org_status ON offboarding_workflows(organization_id, status);

    -- Offboarding checklist items table
    CREATE TABLE offboarding_checklist_items (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id   UUID NOT NULL REFERENCES offboarding_workflows(id) ON DELETE CASCADE,
      item_type     checklist_item_type NOT NULL,
      status        checklist_status NOT NULL DEFAULT 'pending',
      completed_by  UUID REFERENCES users(id),
      completed_at  TIMESTAMPTZ,
      notes         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(workflow_id, item_type)
    );

    CREATE INDEX idx_oci_workflow ON offboarding_checklist_items(workflow_id);

    -- Equipment table
    CREATE TABLE equipment (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id       UUID NOT NULL REFERENCES contractors(id),
      organization_id     UUID NOT NULL REFERENCES organizations(id),
      description         TEXT NOT NULL,
      serial_number       VARCHAR(100),
      assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
      return_requested_at TIMESTAMPTZ,
      returned_at         TIMESTAMPTZ,
      status              equipment_status NOT NULL DEFAULT 'assigned',
      notes               TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_eq_contractor ON equipment(contractor_id);
    CREATE INDEX idx_eq_org ON equipment(organization_id);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE IF EXISTS equipment CASCADE;
    DROP TABLE IF EXISTS offboarding_checklist_items CASCADE;
    DROP TABLE IF EXISTS offboarding_workflows CASCADE;
    DROP TYPE IF EXISTS equipment_status;
    DROP TYPE IF EXISTS checklist_status;
    DROP TYPE IF EXISTS checklist_item_type;
    DROP TYPE IF EXISTS offboarding_reason;
    DROP TYPE IF EXISTS offboarding_status;
  `);
}
