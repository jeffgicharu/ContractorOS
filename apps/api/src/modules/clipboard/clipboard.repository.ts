import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { SharedClipboard } from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';

interface ClipboardRow {
  content: string;
  updated_at: string;
}

function mapRow(row: ClipboardRow): SharedClipboard {
  return {
    content: row.content,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class ClipboardRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async get(): Promise<SharedClipboard | null> {
    const { rows } = await this.pool.query<ClipboardRow>(
      'SELECT content, updated_at FROM shared_clipboard WHERE id = 1',
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async update(content: string): Promise<SharedClipboard> {
    const { rows } = await this.pool.query<ClipboardRow>(
      `INSERT INTO shared_clipboard (id, content, updated_at)
       VALUES (1, $1, now())
       ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
       RETURNING content, updated_at`,
      [content],
    );
    return mapRow(rows[0]!);
  }
}
