import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    -- Single-row table backing the public shared clipboard on the landing
    -- page. The CHECK constraint pins the table to exactly one row.
    CREATE TABLE shared_clipboard (
      id          SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      content     TEXT NOT NULL DEFAULT '',
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    INSERT INTO shared_clipboard (id, content)
    VALUES (1, 'https://claude.ai/public/artifacts/455e139f-8935-4204-aa96-6061c232a735');
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE IF EXISTS shared_clipboard;
  `);
}
