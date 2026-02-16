import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { loadDatabaseConfig } from '../../config/database.config';
import { organizations } from './fixtures/organizations';
import { users, SEED_ADMIN_ID } from './fixtures/users';
import { contractors } from './fixtures/contractors';

const BCRYPT_ROUNDS = 12;

async function seed() {
  const config = loadDatabaseConfig();
  const pool = new Pool(config.pool);

  console.log('Seeding database...\n');

  try {
    // Clean existing seed data (in reverse dependency order)
    await pool.query('DELETE FROM onboarding_steps');
    await pool.query('DELETE FROM contractor_status_history');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM audit_events');
    await pool.query('DELETE FROM contractors');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM organizations');
    console.log('Cleared existing data');

    // Seed organizations
    for (const org of organizations) {
      await pool.query(
        `INSERT INTO organizations (id, name, slug, settings)
         VALUES ($1, $2, $3, $4)`,
        [org.id, org.name, org.slug, JSON.stringify(org.settings)],
      );
    }
    console.log(`Inserted ${organizations.length} organization(s)`);

    // Seed users (hash passwords)
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      await pool.query(
        `INSERT INTO users (id, organization_id, email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, user.organizationId, user.email, hash, user.role, user.firstName, user.lastName],
      );
    }
    console.log(`Inserted ${users.length} user(s)`);

    // Seed contractors
    for (const c of contractors) {
      const activatedAt =
        c.status === 'active' || c.status === 'suspended'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          : null;

      await pool.query(
        `INSERT INTO contractors (
          id, organization_id, email, first_name, last_name, status, type,
          phone, city, state, zip_code, country,
          tin_last_four, bank_name, bank_account_last_four, bank_verified,
          activated_at, invite_token, invite_expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          c.id,
          c.organizationId,
          c.email,
          c.firstName,
          c.lastName,
          c.status,
          c.type,
          c.phone ?? null,
          c.city ?? null,
          c.state ?? null,
          c.zipCode ?? null,
          c.country ?? 'US',
          c.tinLastFour ?? null,
          c.bankName ?? null,
          c.bankAccountLastFour ?? null,
          c.bankVerified ?? false,
          activatedAt,
          (c as Record<string, unknown>).inviteToken ?? null,
          (c as Record<string, unknown>).inviteExpiresAt ?? null,
        ],
      );

      // Create initial status history
      await pool.query(
        `INSERT INTO contractor_status_history (contractor_id, status, changed_by, reason, effective_from)
         VALUES ($1, $2, $3, $4, $5)`,
        [c.id, c.status, SEED_ADMIN_ID, 'Seeded', new Date().toISOString()],
      );

      // Create onboarding steps based on contractor status
      const stepTypes = [
        'invite_accepted',
        'tax_form_submitted',
        'contract_signed',
        'bank_details_submitted',
      ];
      const statusToCompletedSteps: Record<string, number> = {
        invite_sent: 0,
        tax_form_pending: 1,
        contract_pending: 2,
        bank_details_pending: 3,
        active: 4,
        suspended: 4,
        offboarded: 4,
      };
      const completedCount = statusToCompletedSteps[c.status] ?? 0;

      for (let i = 0; i < stepTypes.length; i++) {
        const stepStatus = i < completedCount ? 'completed' : 'pending';
        const completedAt = i < completedCount ? new Date().toISOString() : null;
        await pool.query(
          `INSERT INTO onboarding_steps (contractor_id, step_type, status, completed_at)
           VALUES ($1, $2, $3, $4)`,
          [c.id, stepTypes[i], stepStatus, completedAt],
        );
      }
    }
    console.log(`Inserted ${contractors.length} contractor(s) with onboarding steps`);

    console.log('\nSeed complete!');
    console.log('Login credentials:');
    for (const user of users) {
      console.log(`  ${user.role}: ${user.email} / ${user.password}`);
    }
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
