import type { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { UserRole } from '@contractor-os/shared';

const BCRYPT_ROUNDS = 4;

export interface UserRow {
  id: string;
  organizationId: string;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

interface UserInput {
  pool: Pool;
  orgId: string;
  role: UserRole;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export async function createUser({
  pool,
  orgId,
  role,
  email,
  password = 'Password1',
  firstName = 'Test',
  lastName = 'User',
}: UserInput): Promise<UserRow> {
  const finalEmail = email ?? `${role}-${randomUUID().slice(0, 8)}@example.test`;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users (organization_id, email, password_hash, role, first_name, last_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [orgId, finalEmail, passwordHash, role, firstName, lastName],
  );
  return {
    id: rows[0].id,
    organizationId: orgId,
    email: finalEmail,
    password,
    role,
    firstName,
    lastName,
  };
}
