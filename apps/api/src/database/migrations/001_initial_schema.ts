import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // ─── Helper: updated_at trigger function ──────────────────────
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // ─── 1. organizations ─────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE organizations (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name            VARCHAR(255) NOT NULL,
      slug            VARCHAR(100) NOT NULL UNIQUE,
      settings        JSONB NOT NULL DEFAULT '{}',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TRIGGER trg_organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  // ─── 2. users ─────────────────────────────────────────────────
  pgm.sql(`
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'contractor');

    CREATE TABLE users (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      email           VARCHAR(255) NOT NULL,
      password_hash   VARCHAR(255) NOT NULL,
      role            user_role NOT NULL,
      first_name      VARCHAR(100) NOT NULL,
      last_name       VARCHAR(100) NOT NULL,
      is_active       BOOLEAN NOT NULL DEFAULT true,
      last_login_at   TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (email, organization_id)
    );

    CREATE INDEX idx_users_org_id ON users(organization_id);
    CREATE INDEX idx_users_email ON users(email);

    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  // ─── 3. contractors ───────────────────────────────────────────
  pgm.sql(`
    CREATE TYPE contractor_status AS ENUM (
      'invite_sent',
      'tax_form_pending',
      'contract_pending',
      'bank_details_pending',
      'active',
      'suspended',
      'offboarded'
    );

    CREATE TYPE contractor_type AS ENUM ('domestic', 'foreign');

    CREATE TABLE contractors (
      id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id         UUID NOT NULL REFERENCES organizations(id),
      user_id                 UUID REFERENCES users(id),
      email                   VARCHAR(255) NOT NULL,
      first_name              VARCHAR(100) NOT NULL,
      last_name               VARCHAR(100) NOT NULL,
      status                  contractor_status NOT NULL DEFAULT 'invite_sent',
      type                    contractor_type NOT NULL DEFAULT 'domestic',
      invite_token            VARCHAR(255) UNIQUE,
      invite_expires_at       TIMESTAMPTZ,
      phone                   VARCHAR(50),
      address_line1           VARCHAR(255),
      address_line2           VARCHAR(255),
      city                    VARCHAR(100),
      state                   VARCHAR(50),
      zip_code                VARCHAR(20),
      country                 VARCHAR(100) NOT NULL DEFAULT 'US',
      tin_last_four           VARCHAR(4),
      bank_name               VARCHAR(255),
      bank_routing            VARCHAR(20),
      bank_account_last_four  VARCHAR(4),
      bank_verified           BOOLEAN NOT NULL DEFAULT false,
      activated_at            TIMESTAMPTZ,
      offboarded_at           TIMESTAMPTZ,
      search_vector           TSVECTOR,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_contractors_org_id ON contractors(organization_id);
    CREATE INDEX idx_contractors_status ON contractors(status);
    CREATE INDEX idx_contractors_active ON contractors(organization_id)
      WHERE status = 'active';
    CREATE INDEX idx_contractors_search ON contractors USING GIN(search_vector);
    CREATE UNIQUE INDEX idx_contractors_org_email ON contractors(organization_id, email);

    CREATE TRIGGER trg_contractors_updated_at
      BEFORE UPDATE ON contractors
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  // ─── Full-text search trigger ─────────────────────────────────
  pgm.sql(`
    CREATE FUNCTION contractors_search_update() RETURNS TRIGGER AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_contractors_search
      BEFORE INSERT OR UPDATE OF first_name, last_name, email
      ON contractors
      FOR EACH ROW EXECUTE FUNCTION contractors_search_update();
  `);

  // ─── 4. contractor_status_history ─────────────────────────────
  pgm.sql(`
    CREATE TABLE contractor_status_history (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contractor_id   UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
      status          contractor_status NOT NULL,
      changed_by      UUID NOT NULL REFERENCES users(id),
      reason          TEXT,
      effective_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
      effective_until TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_csh_contractor ON contractor_status_history(contractor_id);
    CREATE INDEX idx_csh_effective ON contractor_status_history(contractor_id, effective_from);
  `);

  // ─── 5. refresh_tokens ────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE refresh_tokens (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash      VARCHAR(255) NOT NULL UNIQUE,
      expires_at      TIMESTAMPTZ NOT NULL,
      revoked_at      TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_rt_user ON refresh_tokens(user_id);
    CREATE INDEX idx_rt_cleanup ON refresh_tokens(expires_at)
      WHERE revoked_at IS NULL;
  `);

  // ─── 6. audit_events ─────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE audit_events (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      user_id         UUID REFERENCES users(id),
      entity_type     VARCHAR(50) NOT NULL,
      entity_id       UUID NOT NULL,
      action          VARCHAR(50) NOT NULL,
      old_values      JSONB,
      new_values      JSONB,
      ip_address      INET,
      correlation_id  UUID,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_audit_org ON audit_events(organization_id);
    CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
    CREATE INDEX idx_audit_created ON audit_events(organization_id, created_at DESC);
    CREATE INDEX idx_audit_user ON audit_events(user_id);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP TABLE IF EXISTS audit_events CASCADE');
  pgm.sql('DROP TABLE IF EXISTS refresh_tokens CASCADE');
  pgm.sql('DROP TABLE IF EXISTS contractor_status_history CASCADE');
  pgm.sql('DROP TRIGGER IF EXISTS trg_contractors_search ON contractors');
  pgm.sql('DROP FUNCTION IF EXISTS contractors_search_update()');
  pgm.sql('DROP TABLE IF EXISTS contractors CASCADE');
  pgm.sql('DROP TYPE IF EXISTS contractor_type');
  pgm.sql('DROP TYPE IF EXISTS contractor_status');
  pgm.sql('DROP TABLE IF EXISTS users CASCADE');
  pgm.sql('DROP TYPE IF EXISTS user_role');
  pgm.sql('DROP TABLE IF EXISTS organizations CASCADE');
  pgm.sql('DROP FUNCTION IF EXISTS set_updated_at()');
}
