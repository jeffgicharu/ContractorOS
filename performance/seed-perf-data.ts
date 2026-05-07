/**
 * Bulk-seed the performance-test target database with realistic volumes:
 *
 *   - ~1000 organizations
 *   - ~1000 admin users (one per org) + a fixed perf admin
 *   - ~10000 contractors (10 per org)
 *   - ~5000 engagements
 *   - ~50000 invoices
 *
 * Implemented as `INSERT INTO ... SELECT FROM generate_series` rather than
 * row-by-row factory inserts — populating 50k invoices via the existing
 * factory takes minutes; the bulk approach finishes in a few seconds.
 *
 * Idempotent: the script truncates everything then re-populates. Safe to
 * run repeatedly on the same target environment.
 *
 * Run with:
 *   DATABASE_URL=postgresql://contractor_os:contractor_os@localhost:5433/contractor_os_perf \
 *   pnpm tsx performance/seed-perf-data.ts
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ORG_COUNT = 1000;
const CONTRACTORS_PER_ORG = 10;
const ENGAGEMENTS_PER_ORG = 5;
const INVOICES_PER_ORG = 50;

// A k6 test user known to every test. Always exists in org #1 ("perf-org-0001").
const PERF_ADMIN_EMAIL = 'admin@perf.test';
const PERF_ADMIN_PASSWORD = 'Password1';

async function applyMigrations(databaseUrl: string): Promise<void> {
  const apiRoot = path.resolve(__dirname, '..', 'apps', 'api');
  const migrateBin = path.join(apiRoot, 'node_modules', 'node-pg-migrate', 'bin', 'node-pg-migrate.js');
  execFileSync(
    process.execPath,
    ['--import', 'tsx', migrateBin, 'up', '--migrations-dir', 'src/database/migrations'],
    {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: ['ignore', 'ignore', 'inherit'],
    },
  );
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://contractor_os:contractor_os@localhost:5434/contractor_os_perf';
  console.log(`Connecting to ${databaseUrl}…`);
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });

  try {
    console.log('Applying migrations…');
    await applyMigrations(databaseUrl);

    console.log('Truncating existing data…');
    await pool.query(`
      TRUNCATE
        audit_events, notifications,
        offboarding_checklist_items, offboarding_workflows, equipment,
        classification_factors, classification_assessments,
        tax_documents, approval_steps, invoice_status_history,
        invoice_line_items, invoices, time_entries, engagements,
        onboarding_steps, contractor_status_history, contractors,
        refresh_tokens, users, organizations
      RESTART IDENTITY CASCADE
    `);

    const t0 = Date.now();
    const passwordHash = await bcrypt.hash(PERF_ADMIN_PASSWORD, 4);

    console.log(`Inserting ${ORG_COUNT} organizations…`);
    await pool.query(
      `
      INSERT INTO organizations (id, name, slug)
      SELECT
        gen_random_uuid(),
        'Perf Org ' || lpad(g::text, 4, '0'),
        'perf-org-' || lpad(g::text, 4, '0')
      FROM generate_series(1, $1) AS g
      `,
      [ORG_COUNT],
    );

    console.log('Inserting admin user per org + the k6 test admin…');
    // First org gets the known-credentials admin
    const firstOrg = await pool.query<{ id: string }>(
      `SELECT id FROM organizations ORDER BY slug ASC LIMIT 1`,
    );
    await pool.query(
      `
      INSERT INTO users (organization_id, email, password_hash, role, first_name, last_name)
      VALUES ($1, $2, $3, 'admin', 'Perf', 'Admin')
      `,
      [firstOrg.rows[0].id, PERF_ADMIN_EMAIL, passwordHash],
    );
    // One bulk-generated admin per remaining org
    await pool.query(
      `
      INSERT INTO users (organization_id, email, password_hash, role, first_name, last_name)
      SELECT
        o.id,
        'admin-' || o.slug || '@perf.test',
        $1,
        'admin',
        'Admin',
        o.slug
      FROM organizations o
      WHERE o.slug != 'perf-org-0001'
      `,
      [passwordHash],
    );

    console.log(`Inserting ${ORG_COUNT * CONTRACTORS_PER_ORG} contractors…`);
    await pool.query(
      `
      INSERT INTO contractors (
        organization_id, email, first_name, last_name, status, type, activated_at
      )
      SELECT
        o.id,
        'contractor-' || lpad(c::text, 2, '0') || '-' || o.slug || '@perf.test',
        'Casey',
        'Contractor' || lpad(c::text, 2, '0'),
        'active',
        'domestic',
        now()
      FROM organizations o
      CROSS JOIN generate_series(1, $1) AS c
      `,
      [CONTRACTORS_PER_ORG],
    );

    console.log(`Inserting ${ORG_COUNT * ENGAGEMENTS_PER_ORG} engagements…`);
    // Build the engagement set: 5 per org, all assigned to the org's first
    // contractor (last_name = 'Contractor01'). This keeps total at 5k.
    await pool.query(
      `
      WITH first_contractors AS (
        SELECT id, organization_id
        FROM contractors
        WHERE last_name = 'Contractor01'
      )
      INSERT INTO engagements (
        contractor_id, organization_id, title, start_date, hourly_rate,
        currency, payment_terms, status
      )
      SELECT
        fc.id,
        fc.organization_id,
        'Engagement ' || lpad(e::text, 2, '0'),
        CURRENT_DATE - ((random() * 365)::int),
        (75 + random() * 150)::numeric(10, 2),
        'USD',
        'net_30',
        'active'
      FROM first_contractors fc
      CROSS JOIN generate_series(1, $1) AS e
      `,
      [ENGAGEMENTS_PER_ORG],
    );

    console.log(`Inserting ${ORG_COUNT * INVOICES_PER_ORG} invoices…`);
    // 50 invoices per org. Each invoice picks one of the org's 5 engagements
    // (round-robin via i % engagements_per_org) so all 5 get used.
    await pool.query(
      `
      WITH org_engagements AS (
        SELECT
          organization_id,
          contractor_id,
          id AS engagement_id,
          row_number() OVER (PARTITION BY organization_id ORDER BY id) - 1 AS rn
        FROM engagements
      ),
      slots AS (
        SELECT
          oe.organization_id,
          oe.contractor_id,
          oe.engagement_id,
          i AS slot,
          ((row_number() OVER (PARTITION BY oe.organization_id ORDER BY oe.rn, i)) - 1) AS seq
        FROM org_engagements oe
        CROSS JOIN generate_series(1, $2) AS i
        WHERE oe.rn = (i - 1) % $1
      )
      INSERT INTO invoices (
        contractor_id, engagement_id, organization_id, invoice_number, status,
        submitted_at, approved_at, paid_at,
        subtotal, total_amount, period_start, period_end
      )
      SELECT
        s.contractor_id,
        s.engagement_id,
        s.organization_id,
        'PERF-' || lpad((s.seq + 1)::text, 4, '0'),
        ((ARRAY['draft','submitted','under_review','approved','scheduled','paid'])
          [1 + (s.seq % 6)])::invoice_status,
        CASE WHEN s.seq % 6 >= 1 THEN now() - (random() * INTERVAL '60 days') END,
        CASE WHEN s.seq % 6 >= 3 THEN now() - (random() * INTERVAL '40 days') END,
        CASE WHEN s.seq % 6 = 5 THEN now() - (random() * INTERVAL '20 days') END,
        (1000 + random() * 9000)::numeric(12, 2),
        (1000 + random() * 9000)::numeric(12, 2),
        CURRENT_DATE - ((random() * 365)::int) - INTERVAL '30 days',
        CURRENT_DATE - ((random() * 30)::int)
      FROM slots s
      `,
      [ENGAGEMENTS_PER_ORG, INVOICES_PER_ORG],
    );

    console.log('Refreshing materialized views…');
    await pool.query('REFRESH MATERIALIZED VIEW mv_classification_risk_summary').catch(() => {
      // The view may not exist if migration 006 ran without seed factors;
      // it is safe to skip — it isn't on the perf-test critical path.
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const counts = await pool.query<{
      orgs: string;
      users: string;
      contractors: string;
      engagements: string;
      invoices: string;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM organizations)::text AS orgs,
        (SELECT COUNT(*) FROM users)::text AS users,
        (SELECT COUNT(*) FROM contractors)::text AS contractors,
        (SELECT COUNT(*) FROM engagements)::text AS engagements,
        (SELECT COUNT(*) FROM invoices)::text AS invoices
    `);
    const r = counts.rows[0];
    console.log('\n✓ Seed complete in', elapsed, 's');
    console.log(`  organizations: ${r.orgs}`);
    console.log(`  users:         ${r.users}`);
    console.log(`  contractors:   ${r.contractors}`);
    console.log(`  engagements:   ${r.engagements}`);
    console.log(`  invoices:      ${r.invoices}`);
    console.log(`\nk6 test admin: ${PERF_ADMIN_EMAIL} / ${PERF_ADMIN_PASSWORD}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
