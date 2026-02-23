import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.module';

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class OrganizationsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findById(id: string): Promise<OrganizationRow | null> {
    const { rows } = await this.pool.query<OrganizationRow>(
      'SELECT * FROM organizations WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  async updateNameAndSettings(
    id: string,
    name: string | undefined,
    settings: Record<string, unknown>,
  ): Promise<OrganizationRow> {
    if (name !== undefined) {
      const { rows } = await this.pool.query<OrganizationRow>(
        `UPDATE organizations
         SET name = $2, settings = $3, updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [id, name, JSON.stringify(settings)],
      );
      return rows[0]!;
    }

    const { rows } = await this.pool.query<OrganizationRow>(
      `UPDATE organizations
       SET settings = $2, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, JSON.stringify(settings)],
    );
    return rows[0]!;
  }
}
