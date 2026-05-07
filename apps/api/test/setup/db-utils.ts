import type { Pool } from 'pg';

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

export async function resetDatabase(pool: Pool): Promise<void> {
  await pool.query(
    `TRUNCATE ${TABLES_IN_TRUNCATE_ORDER.join(', ')} RESTART IDENTITY CASCADE`,
  );
}
