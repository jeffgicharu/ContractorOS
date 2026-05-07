import type { Pool } from 'pg';
import { randomUUID } from 'node:crypto';

export interface OrgRow {
  id: string;
  name: string;
  slug: string;
}

export async function createOrg(
  pool: Pool,
  overrides: Partial<{ name: string; slug: string }> = {},
): Promise<OrgRow> {
  const slug = overrides.slug ?? `org-${randomUUID().slice(0, 8)}`;
  const name = overrides.name ?? `Org ${slug}`;
  const { rows } = await pool.query<OrgRow>(
    `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug`,
    [name, slug],
  );
  return rows[0];
}
