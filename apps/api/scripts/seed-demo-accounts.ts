/**
 * Idempotent seed for a stable set of demo accounts used by the live-smoke
 * E2E suite. Safe to re-run — it upserts orgs/users by their natural keys
 * and never deletes existing data.
 *
 * Accounts created (all share password `pass1234`):
 *   Demo Co  (slug=demo-co)
 *     - alice@demo.contractoros.test   role=admin
 *     - carol@demo.contractoros.test   role=contractor + contractors-row
 *   Other Org (slug=other-org)
 *     - bob@demo.contractoros.test     role=admin
 *
 * Bob's org exists strictly so the live-smoke multi-tenant probe has a
 * second tenant to attempt to cross into.
 */
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { loadDatabaseConfig } from '../src/config/database.config';

const BCRYPT_ROUNDS = 12;
const PASSWORD = 'pass1234';

interface OrgSeed {
  slug: string;
  name: string;
}

interface UserSeed {
  email: string;
  orgSlug: string;
  role: 'admin' | 'manager' | 'contractor';
  firstName: string;
  lastName: string;
}

interface ContractorSeed {
  email: string;
  orgSlug: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'invite_sent' | 'pending_onboarding';
}

const ORGS: OrgSeed[] = [
  { slug: 'demo-co', name: 'Demo Co' },
  { slug: 'other-org', name: 'Other Org' },
];

const USERS: UserSeed[] = [
  { email: 'alice@demo.contractoros.test', orgSlug: 'demo-co',   role: 'admin',      firstName: 'Alice', lastName: 'Demo' },
  { email: 'bob@demo.contractoros.test',   orgSlug: 'other-org', role: 'admin',      firstName: 'Bob',   lastName: 'Other' },
  { email: 'carol@demo.contractoros.test', orgSlug: 'demo-co',   role: 'contractor', firstName: 'Carol', lastName: 'Demo' },
];

const CONTRACTORS: ContractorSeed[] = [
  { email: 'carol@demo.contractoros.test', orgSlug: 'demo-co', firstName: 'Carol', lastName: 'Demo', status: 'active' },
];

async function main() {
  const pool = new Pool(loadDatabaseConfig().pool);
  const hash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  console.log('Seeding stable demo accounts (idempotent)…\n');

  try {
    const orgIdBySlug = new Map<string, string>();
    for (const org of ORGS) {
      const existing = await pool.query<{ id: string }>(
        'SELECT id FROM organizations WHERE slug = $1',
        [org.slug],
      );
      let id: string;
      if (existing.rowCount && existing.rowCount > 0) {
        id = existing.rows[0]!.id;
        console.log(`  org ${org.slug.padEnd(10)} exists  ${id}`);
      } else {
        const inserted = await pool.query<{ id: string }>(
          `INSERT INTO organizations (name, slug, settings)
           VALUES ($1, $2, $3) RETURNING id`,
          [org.name, org.slug, JSON.stringify({ defaultPaymentTerms: 'net_30', defaultCurrency: 'USD' })],
        );
        id = inserted.rows[0]!.id;
        console.log(`  org ${org.slug.padEnd(10)} created ${id}`);
      }
      orgIdBySlug.set(org.slug, id);
    }

    const userIdByEmail = new Map<string, string>();
    for (const u of USERS) {
      const orgId = orgIdBySlug.get(u.orgSlug);
      if (!orgId) throw new Error(`missing org for user ${u.email}`);

      const existing = await pool.query<{ id: string }>(
        'SELECT id FROM users WHERE email = $1 AND organization_id = $2',
        [u.email, orgId],
      );
      let id: string;
      if (existing.rowCount && existing.rowCount > 0) {
        id = existing.rows[0]!.id;
        await pool.query(
          `UPDATE users SET password_hash = $1, role = $2, first_name = $3, last_name = $4, is_active = true WHERE id = $5`,
          [hash, u.role, u.firstName, u.lastName, id],
        );
        console.log(`  user ${u.email.padEnd(38)} updated`);
      } else {
        const inserted = await pool.query<{ id: string }>(
          `INSERT INTO users (organization_id, email, password_hash, role, first_name, last_name)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [orgId, u.email, hash, u.role, u.firstName, u.lastName],
        );
        id = inserted.rows[0]!.id;
        console.log(`  user ${u.email.padEnd(38)} created`);
      }
      userIdByEmail.set(u.email, id);
    }

    for (const c of CONTRACTORS) {
      const orgId = orgIdBySlug.get(c.orgSlug);
      const userId = userIdByEmail.get(c.email);
      if (!orgId || !userId) throw new Error(`missing org/user for contractor ${c.email}`);

      const existing = await pool.query(
        'SELECT id FROM contractors WHERE email = $1 AND organization_id = $2',
        [c.email, orgId],
      );
      if (existing.rowCount && existing.rowCount > 0) {
        console.log(`  contractor ${c.email.padEnd(34)} exists`);
      } else {
        await pool.query(
          `INSERT INTO contractors (organization_id, user_id, email, first_name, last_name, status, type, country)
           VALUES ($1, $2, $3, $4, $5, $6, 'domestic', 'US')`,
          [orgId, userId, c.email, c.firstName, c.lastName, c.status],
        );
        console.log(`  contractor ${c.email.padEnd(34)} created`);
      }
    }

    console.log('\nDemo account seed complete.');
    console.log(`Login with any of the emails above and password: ${PASSWORD}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
