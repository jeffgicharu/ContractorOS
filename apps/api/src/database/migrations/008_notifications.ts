import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    -- Notification type enum
    CREATE TYPE notification_type AS ENUM (
      'onboarding_reminder',
      'invoice_submitted',
      'invoice_approved',
      'invoice_rejected',
      'invoice_paid',
      'document_expiring',
      'document_expired',
      'classification_risk_change',
      'offboarding_started',
      'offboarding_action_required'
    );

    -- Notifications table
    CREATE TABLE notifications (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id),
      type        notification_type NOT NULL,
      title       VARCHAR(255) NOT NULL,
      body        TEXT NOT NULL,
      data        JSONB NOT NULL DEFAULT '{}',
      read_at     TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_notif_user ON notifications(user_id);
    CREATE INDEX idx_notif_unread ON notifications(user_id) WHERE read_at IS NULL;
    CREATE INDEX idx_notif_user_created ON notifications(user_id, created_at DESC);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE IF EXISTS notifications;
    DROP TYPE IF EXISTS notification_type;
  `);
}
