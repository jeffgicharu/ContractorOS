/* eslint-disable @typescript-eslint/no-unused-vars */
import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Migration up
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Migration down
}
