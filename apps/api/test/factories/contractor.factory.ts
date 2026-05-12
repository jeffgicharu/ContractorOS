import type { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import {
  ContractorStatus,
  ContractorType,
  UserRole,
} from '@contractor-os/shared';

const BCRYPT_ROUNDS = 4;

export interface ContractorRow {
  id: string;
  userId: string | null;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: ContractorStatus;
  inviteToken: string | null;
  password: string;
}

interface ContractorInput {
  pool: Pool;
  orgId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: ContractorStatus;
  type?: ContractorType;
  password?: string;
  withUser?: boolean;
}

export async function createContractor({
  pool,
  orgId,
  email,
  firstName = 'Casey',
  lastName = 'Contractor',
  status = ContractorStatus.ACTIVE,
  type = ContractorType.DOMESTIC,
  password = 'Password1',
  withUser = true,
}: ContractorInput): Promise<ContractorRow> {
  const finalEmail = email ?? `contractor-${randomUUID().slice(0, 8)}@example.test`;
  const inviteToken = randomUUID();
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  let userId: string | null = null;
  if (withUser) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userInsert = await pool.query<{ id: string }>(
      `INSERT INTO users (organization_id, email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [orgId, finalEmail, passwordHash, UserRole.CONTRACTOR, firstName, lastName],
    );
    userId = userInsert.rows[0].id;
  }

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO contractors (
       organization_id, user_id, email, first_name, last_name, status, type,
       invite_token, invite_expires_at, activated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      orgId,
      userId,
      finalEmail,
      firstName,
      lastName,
      status,
      type,
      inviteToken,
      inviteExpiresAt,
      status === ContractorStatus.ACTIVE ? new Date() : null,
    ],
  );

  return {
    id: rows[0].id,
    userId,
    organizationId: orgId,
    email: finalEmail,
    firstName,
    lastName,
    status,
    inviteToken,
    password,
  };
}
