import path from 'node:path';

export const PACT_DIR = path.resolve(__dirname, '../../../../pacts');

export const CONSUMER = 'contractor-os-web';
export const PROVIDER = 'contractor-os-api';

// Stable IDs used by every consumer interaction. The matching state handlers
// in apps/api/test/pact/state-handlers.ts seed rows with exactly these IDs.
export const ORG_A_ID = '00000000-0000-0000-0000-000000000001';
export const ADMIN_USER_ID = '00000000-0000-0000-0000-0000000000a1';
export const CONTRACTOR_USER_ID = '00000000-0000-0000-0000-0000000000a2';
export const CONTRACTOR_ID = '00000000-0000-0000-0000-0000000000c1';
export const ENGAGEMENT_ID = '00000000-0000-0000-0000-0000000000e1';
export const DRAFT_INVOICE_ID = '00000000-0000-0000-0000-0000000000d1';
export const SUBMITTED_INVOICE_ID = '00000000-0000-0000-0000-0000000000d2';
export const INVITE_TOKEN = 'pact-invite-token-fixed';
export const PENDING_CONTRACTOR_ID = '00000000-0000-0000-0000-0000000000c2';

// Magic Bearer values that the provider verifier swaps for a real JWT before
// replaying the request. Keeps the consumer-side contract free of
// secret-dependent strings.
export const ADMIN_BEARER = 'pact-admin-token';
export const CONTRACTOR_BEARER = 'pact-contractor-token';
