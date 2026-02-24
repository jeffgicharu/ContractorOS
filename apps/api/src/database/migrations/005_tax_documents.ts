import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    -- Document type enum
    CREATE TYPE tax_document_type AS ENUM (
      'w9',
      'w8ben',
      'contract',
      'nda',
      'insurance_certificate',
      'other'
    );

    -- Tax documents table
    CREATE TABLE tax_documents (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      document_type   tax_document_type NOT NULL,
      file_path       VARCHAR(500) NOT NULL,
      file_name       VARCHAR(255) NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      mime_type       VARCHAR(100) NOT NULL,
      uploaded_by     UUID NOT NULL REFERENCES users(id),
      expires_at      TIMESTAMPTZ,
      tin_last_four   VARCHAR(4),
      is_current      BOOLEAN NOT NULL DEFAULT true,
      version         INTEGER NOT NULL DEFAULT 1,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Indexes
    CREATE INDEX idx_docs_contractor ON tax_documents(contractor_id);
    CREATE INDEX idx_docs_expiring ON tax_documents(expires_at)
      WHERE is_current = true AND expires_at IS NOT NULL;
    CREATE INDEX idx_docs_current ON tax_documents(contractor_id, document_type)
      WHERE is_current = true;

    -- Auto-update timestamp trigger (function already exists from migration 001)
    CREATE TRIGGER trg_tax_documents_updated_at
      BEFORE UPDATE ON tax_documents
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE IF EXISTS tax_documents CASCADE;
    DROP TYPE IF EXISTS tax_document_type;
  `);
}
