// IDs that the consumer-side Pact contracts hard-code. State handlers in
// state-handlers.ts seed rows using these exact IDs so the replayed
// consumer requests resolve against real data.
export const ORG_A_ID = '00000000-0000-0000-0000-000000000001';
export const ADMIN_USER_ID = '00000000-0000-0000-0000-0000000000a1';
export const CONTRACTOR_USER_ID = '00000000-0000-0000-0000-0000000000a2';
export const CONTRACTOR_ID = '00000000-0000-0000-0000-0000000000c1';
export const ENGAGEMENT_ID = '00000000-0000-0000-0000-0000000000e1';
export const DRAFT_INVOICE_ID = '00000000-0000-0000-0000-0000000000d1';
export const SUBMITTED_INVOICE_ID = '00000000-0000-0000-0000-0000000000d2';
export const INVITE_TOKEN = 'pact-invite-token-fixed';
export const PENDING_CONTRACTOR_ID = '00000000-0000-0000-0000-0000000000c2';

export const ADMIN_BEARER = 'pact-admin-token';
export const CONTRACTOR_BEARER = 'pact-contractor-token';

export const ADMIN_PASSWORD = 'Password1';
