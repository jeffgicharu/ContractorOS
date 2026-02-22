import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    -- Notification list sorted by created_at for paginated queries
    CREATE INDEX IF NOT EXISTS idx_notif_user_created
      ON notifications (user_id, created_at DESC);

    -- Audit events: org-scoped queries sorted by timestamp
    CREATE INDEX IF NOT EXISTS idx_audit_org_created
      ON audit_events (organization_id, created_at DESC);

    -- Audit events: filter by entity type within org
    CREATE INDEX IF NOT EXISTS idx_audit_org_entity
      ON audit_events (organization_id, entity_type);

    -- Invoices: status filter queries (most common admin query)
    CREATE INDEX IF NOT EXISTS idx_invoices_org_status
      ON invoices (organization_id, status);

    -- Contractors: status filter + search queries
    CREATE INDEX IF NOT EXISTS idx_contractors_org_status
      ON contractors (organization_id, status);

    -- Time entries: engagement lookup sorted by date
    CREATE INDEX IF NOT EXISTS idx_time_entries_engagement_date
      ON time_entries (engagement_id, entry_date DESC);

    -- Documents: compliance report queries (org + current + expiry)
    CREATE INDEX IF NOT EXISTS idx_documents_org_current
      ON tax_documents (organization_id, is_current)
      WHERE is_current = true;

    -- Classification: latest assessment per contractor
    CREATE INDEX IF NOT EXISTS idx_classification_contractor_assessed
      ON classification_assessments (contractor_id, assessed_at DESC);

    -- Offboarding: org-scoped status queries
    CREATE INDEX IF NOT EXISTS idx_offboarding_org_status
      ON offboarding_workflows (organization_id, status);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_notif_user_created;
    DROP INDEX IF EXISTS idx_audit_org_created;
    DROP INDEX IF EXISTS idx_audit_org_entity;
    DROP INDEX IF EXISTS idx_invoices_org_status;
    DROP INDEX IF EXISTS idx_contractors_org_status;
    DROP INDEX IF EXISTS idx_time_entries_engagement_date;
    DROP INDEX IF EXISTS idx_documents_org_current;
    DROP INDEX IF EXISTS idx_classification_contractor_assessed;
    DROP INDEX IF EXISTS idx_offboarding_org_status;
  `);
}
