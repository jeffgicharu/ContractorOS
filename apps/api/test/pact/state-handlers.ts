import type { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import {
  ORG_A_ID,
  ADMIN_USER_ID,
  CONTRACTOR_USER_ID,
  CONTRACTOR_ID,
  ENGAGEMENT_ID,
  DRAFT_INVOICE_ID,
  SUBMITTED_INVOICE_ID,
  INVITE_TOKEN,
  PENDING_CONTRACTOR_ID,
  ADMIN_PASSWORD,
} from './constants';

const TABLES_IN_TRUNCATE_ORDER = [
  'audit_events',
  'notifications',
  'offboarding_checklist_items',
  'offboarding_workflows',
  'equipment',
  'classification_factors',
  'classification_assessments',
  'tax_documents',
  'approval_steps',
  'invoice_status_history',
  'invoice_line_items',
  'invoices',
  'time_entries',
  'engagements',
  'onboarding_steps',
  'contractor_status_history',
  'contractors',
  'refresh_tokens',
  'users',
  'organizations',
];

async function reset(pool: Pool): Promise<void> {
  await pool.query(
    `TRUNCATE ${TABLES_IN_TRUNCATE_ORDER.join(', ')} RESTART IDENTITY CASCADE`,
  );
}

async function seedOrgA(pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO organizations (id, name, slug)
     VALUES ($1, 'Org A', 'org-a')
     ON CONFLICT (id) DO NOTHING`,
    [ORG_A_ID],
  );
}

async function seedAdmin(pool: Pool): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 4);
  await pool.query(
    `INSERT INTO users (id, organization_id, email, password_hash, role, first_name, last_name)
     VALUES ($1, $2, 'admin@org.test', $3, 'admin', 'Admin', 'User')
     ON CONFLICT (id) DO NOTHING`,
    [ADMIN_USER_ID, ORG_A_ID, passwordHash],
  );
}

async function seedActiveContractor(pool: Pool): Promise<void> {
  const passwordHash = await bcrypt.hash('Password1', 4);
  await pool.query(
    `INSERT INTO users (id, organization_id, email, password_hash, role, first_name, last_name)
     VALUES ($1, $2, 'casey@org.test', $3, 'contractor', 'Casey', 'Contractor')
     ON CONFLICT (id) DO NOTHING`,
    [CONTRACTOR_USER_ID, ORG_A_ID, passwordHash],
  );
  await pool.query(
    `INSERT INTO contractors (
       id, organization_id, user_id, email, first_name, last_name, status, type, activated_at
     ) VALUES ($1, $2, $3, 'casey@org.test', 'Casey', 'Contractor', 'active', 'domestic', now())
     ON CONFLICT (id) DO NOTHING`,
    [CONTRACTOR_ID, ORG_A_ID, CONTRACTOR_USER_ID],
  );
}

async function seedActiveEngagement(pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO engagements (
       id, contractor_id, organization_id, title, start_date, hourly_rate, currency, payment_terms, status
     ) VALUES ($1, $2, $3, 'Pact Test Engagement', CURRENT_DATE, 125, 'USD', 'net_30', 'active')
     ON CONFLICT (id) DO NOTHING`,
    [ENGAGEMENT_ID, CONTRACTOR_ID, ORG_A_ID],
  );
}

async function seedDraftInvoice(pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO invoices (
       id, contractor_id, engagement_id, organization_id, invoice_number, status,
       subtotal, total_amount, period_start, period_end
     ) VALUES ($1, $2, $3, $4, 'SEED-INV-001', 'draft', 1000, 1000, '2026-04-01', '2026-04-30')
     ON CONFLICT (id) DO NOTHING`,
    [DRAFT_INVOICE_ID, CONTRACTOR_ID, ENGAGEMENT_ID, ORG_A_ID],
  );
  await pool.query(
    `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price)
     VALUES ($1, 'Hours', 8, 125)`,
    [DRAFT_INVOICE_ID],
  );
}

async function seedSubmittedInvoice(pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO invoices (
       id, contractor_id, engagement_id, organization_id, invoice_number, status,
       submitted_at, subtotal, total_amount, period_start, period_end
     ) VALUES ($1, $2, $3, $4, 'SEED-INV-002', 'submitted', now(), 2000, 2000, '2026-04-01', '2026-04-30')
     ON CONFLICT (id) DO NOTHING`,
    [SUBMITTED_INVOICE_ID, CONTRACTOR_ID, ENGAGEMENT_ID, ORG_A_ID],
  );
  await pool.query(
    `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price)
     VALUES ($1, 'Hours', 16, 125)`,
    [SUBMITTED_INVOICE_ID],
  );
  // Create the pending approval step that the approve handler requires
  await pool.query(
    `INSERT INTO approval_steps (invoice_id, approver_id, step_order, decision)
     VALUES ($1, $2, 1, 'pending')`,
    [SUBMITTED_INVOICE_ID, ADMIN_USER_ID],
  );
}

async function seedPendingInvite(pool: Pool): Promise<void> {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  await pool.query(
    `INSERT INTO contractors (
       id, organization_id, email, first_name, last_name, status, type,
       invite_token, invite_expires_at
     ) VALUES ($1, $2, 'invitee@org.test', 'Casey', 'Contractor', 'invite_sent', 'domestic', $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [PENDING_CONTRACTOR_ID, ORG_A_ID, INVITE_TOKEN, expiry],
  );
}

export type StateHandler = () => Promise<void>;

/**
 * Returns a map of provider-state name -> setup function. Each function
 * resets the DB then incrementally seeds the entities that state describes.
 * The Pact verifier calls the matching handler before each interaction is
 * replayed.
 */
export function buildStateHandlers(pool: Pool): Record<string, StateHandler> {
  const baseAdmin = async () => {
    await reset(pool);
    await seedOrgA(pool);
    await seedAdmin(pool);
  };

  const withActiveContractor = async () => {
    await baseAdmin();
    await seedActiveContractor(pool);
  };

  const withActiveEngagement = async () => {
    await withActiveContractor();
    await seedActiveEngagement(pool);
  };

  const withDraftInvoice = async () => {
    await withActiveEngagement();
    await seedDraftInvoice(pool);
  };

  const withSubmittedInvoice = async () => {
    await withActiveEngagement();
    await seedSubmittedInvoice(pool);
  };

  const withPendingInvite = async () => {
    await baseAdmin();
    await seedPendingInvite(pool);
  };

  return {
    'an admin user admin@org.test exists with password Password1': baseAdmin,
    'an admin user admin@org.test exists and a wrong-password login is attempted': baseAdmin,
    [`a contractor invite token ${INVITE_TOKEN} is pending for contractor ${PENDING_CONTRACTOR_ID}`]: withPendingInvite,
    [`an active contractor ${CONTRACTOR_ID} exists in org A as the only contractor`]: withActiveContractor,
    [`an active engagement ${ENGAGEMENT_ID} exists for the contractor in org A`]: withActiveEngagement,
    [`a draft invoice ${DRAFT_INVOICE_ID} exists for the engagement in org A`]: withDraftInvoice,
    [`a submitted invoice ${SUBMITTED_INVOICE_ID} exists for the engagement in org A`]: withSubmittedInvoice,
  };
}
