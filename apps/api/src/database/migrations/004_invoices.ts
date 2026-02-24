import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    -- Invoice status enum
    CREATE TYPE invoice_status AS ENUM (
      'draft', 'submitted', 'under_review', 'approved',
      'scheduled', 'paid', 'disputed', 'rejected', 'cancelled'
    );

    -- Approval decision enum
    CREATE TYPE approval_decision AS ENUM ('pending', 'approved', 'rejected');

    -- Invoices table
    CREATE TABLE invoices (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id),
      engagement_id   UUID NOT NULL REFERENCES engagements(id),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      invoice_number  VARCHAR(50) NOT NULL,
      status          invoice_status NOT NULL DEFAULT 'draft',
      submitted_at    TIMESTAMPTZ,
      approved_at     TIMESTAMPTZ,
      scheduled_at    TIMESTAMPTZ,
      paid_at         TIMESTAMPTZ,
      due_date        DATE,
      subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
      tax_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
      total_amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,
      currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
      notes           TEXT,
      period_start    DATE NOT NULL,
      period_end      DATE NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (organization_id, invoice_number),
      CONSTRAINT chk_period CHECK (period_end >= period_start),
      CONSTRAINT chk_amounts CHECK (total_amount >= 0 AND subtotal >= 0)
    );

    CREATE INDEX idx_invoices_contractor ON invoices(contractor_id);
    CREATE INDEX idx_invoices_org ON invoices(organization_id);
    CREATE INDEX idx_invoices_status ON invoices(organization_id, status);
    CREATE INDEX idx_invoices_due ON invoices(due_date) WHERE status IN ('approved', 'scheduled');

    CREATE TRIGGER trg_invoices_updated_at
      BEFORE UPDATE ON invoices
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    -- Invoice line items table
    CREATE TABLE invoice_line_items (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description     VARCHAR(500) NOT NULL,
      quantity        NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
      unit_price      NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
      amount          NUMERIC(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED,
      time_entry_id   UUID REFERENCES time_entries(id),
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);

    -- Invoice status history table
    CREATE TABLE invoice_status_history (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      from_status     invoice_status,
      to_status       invoice_status NOT NULL,
      changed_by      UUID NOT NULL REFERENCES users(id),
      reason          TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_ish_invoice ON invoice_status_history(invoice_id);

    -- Approval steps table
    CREATE TABLE approval_steps (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      approver_id     UUID NOT NULL REFERENCES users(id),
      step_order      INTEGER NOT NULL,
      decision        approval_decision NOT NULL DEFAULT 'pending',
      decided_at      TIMESTAMPTZ,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (invoice_id, step_order)
    );

    CREATE INDEX idx_approval_invoice ON approval_steps(invoice_id);
    CREATE INDEX idx_approval_pending ON approval_steps(approver_id) WHERE decision = 'pending';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE IF EXISTS approval_steps CASCADE;
    DROP TABLE IF EXISTS invoice_status_history CASCADE;
    DROP TABLE IF EXISTS invoice_line_items CASCADE;
    DROP TABLE IF EXISTS invoices CASCADE;
    DROP TYPE IF EXISTS approval_decision;
    DROP TYPE IF EXISTS invoice_status;
  `);
}
