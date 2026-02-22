import { SEED_ADMIN_ID, SEED_CONTRACTOR_USER_ID } from './users';

export const notifications = [
  {
    userId: SEED_ADMIN_ID,
    type: 'invoice_submitted',
    title: 'Invoice Submitted',
    body: 'Invoice INV-2024-001 has been submitted for review',
    data: { invoiceNumber: 'INV-2024-001' },
  },
  {
    userId: SEED_ADMIN_ID,
    type: 'offboarding_started',
    title: 'Offboarding Started',
    body: 'Offboarding initiated for John Smith',
    data: { contractorName: 'John Smith' },
  },
  {
    userId: SEED_ADMIN_ID,
    type: 'classification_risk_change',
    title: 'Risk Level Changed',
    body: 'Contractor risk level changed from low to medium',
    data: { oldRisk: 'low', newRisk: 'medium' },
  },
  {
    userId: SEED_CONTRACTOR_USER_ID,
    type: 'invoice_approved',
    title: 'Invoice Approved',
    body: 'Invoice INV-2024-002 has been approved',
    data: { invoiceNumber: 'INV-2024-002' },
  },
  {
    userId: SEED_CONTRACTOR_USER_ID,
    type: 'invoice_paid',
    title: 'Invoice Paid',
    body: 'Invoice INV-2024-003 has been paid',
    data: { invoiceNumber: 'INV-2024-003' },
  },
];
