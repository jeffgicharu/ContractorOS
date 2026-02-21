import { SEED_ORG_ID } from './organizations';
import { SEED_ADMIN_ID } from './users';

// Engagement IDs from engagements.ts:
// 44444444-4444-4444-4444-444444444401 — John Smith, Frontend Dashboard Redesign (active, net_30)
// 44444444-4444-4444-4444-444444444402 — John Smith, API Performance Optimization (completed, net_30)
// 44444444-4444-4444-4444-444444444403 — Maria Garcia, Mobile App Backend Integration (active, net_15)

// Contractor IDs:
// 33333333-3333-3333-3333-333333333301 — John Smith
// 33333333-3333-3333-3333-333333333302 — Maria Garcia

export const invoices = [
  {
    id: '55555555-5555-5555-5555-555555555501',
    contractorId: '33333333-3333-3333-3333-333333333301',
    engagementId: '44444444-4444-4444-4444-444444444401',
    organizationId: SEED_ORG_ID,
    invoiceNumber: 'INV-2026-001',
    status: 'paid' as const,
    submittedAt: '2026-01-10T10:00:00Z',
    approvedAt: '2026-01-12T14:00:00Z',
    scheduledAt: '2026-01-20T09:00:00Z',
    paidAt: '2026-01-25T16:00:00Z',
    dueDate: '2026-02-11',
    notes: 'January work on dashboard redesign.',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    lineItems: [
      {
        description: 'Dashboard layout implementation',
        quantity: 40,
        unitPrice: 150,
      },
      {
        description: 'Sidebar navigation redesign',
        quantity: 16,
        unitPrice: 150,
      },
      {
        description: 'Chart components integration',
        quantity: 8,
        unitPrice: 150,
      },
    ],
  },
  {
    id: '55555555-5555-5555-5555-555555555502',
    contractorId: '33333333-3333-3333-3333-333333333301',
    engagementId: '44444444-4444-4444-4444-444444444401',
    organizationId: SEED_ORG_ID,
    invoiceNumber: 'INV-2026-002',
    status: 'approved' as const,
    submittedAt: '2026-02-05T10:00:00Z',
    approvedAt: '2026-02-07T11:30:00Z',
    scheduledAt: null,
    paidAt: null,
    dueDate: '2026-03-09',
    notes: 'February work — first half.',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-15',
    lineItems: [
      {
        description: 'User settings page',
        quantity: 24,
        unitPrice: 150,
      },
      {
        description: 'Notification system UI',
        quantity: 16,
        unitPrice: 150,
      },
    ],
  },
  {
    id: '55555555-5555-5555-5555-555555555503',
    contractorId: '33333333-3333-3333-3333-333333333302',
    engagementId: '44444444-4444-4444-4444-444444444403',
    organizationId: SEED_ORG_ID,
    invoiceNumber: 'INV-2026-003',
    status: 'submitted' as const,
    submittedAt: '2026-02-18T09:00:00Z',
    approvedAt: null,
    scheduledAt: null,
    paidAt: null,
    dueDate: null,
    notes: null,
    periodStart: '2026-02-01',
    periodEnd: '2026-02-15',
    lineItems: [
      {
        description: 'Authentication API endpoints',
        quantity: 20,
        unitPrice: 125,
      },
      {
        description: 'Profile management endpoints',
        quantity: 12,
        unitPrice: 125,
      },
      {
        description: 'Push notification integration',
        quantity: 8,
        unitPrice: 125,
      },
    ],
  },
  {
    id: '55555555-5555-5555-5555-555555555504',
    contractorId: '33333333-3333-3333-3333-333333333301',
    engagementId: '44444444-4444-4444-4444-444444444401',
    organizationId: SEED_ORG_ID,
    invoiceNumber: 'INV-2026-004',
    status: 'draft' as const,
    submittedAt: null,
    approvedAt: null,
    scheduledAt: null,
    paidAt: null,
    dueDate: null,
    notes: 'Work in progress — second half of February.',
    periodStart: '2026-02-16',
    periodEnd: '2026-02-28',
    lineItems: [
      {
        description: 'Responsive layout fixes',
        quantity: 12,
        unitPrice: 150,
      },
      {
        description: 'Performance optimization',
        quantity: 8,
        unitPrice: 150,
      },
    ],
  },
];

export const invoiceStatusHistory = [
  // INV-2026-001: draft → submitted → under_review → approved → scheduled → paid
  // Note: In production, changedBy would be the contractor's user ID for submit actions.
  // For seeds, we use the admin ID since contractors don't have user records yet.
  {
    invoiceId: '55555555-5555-5555-5555-555555555501',
    fromStatus: null,
    toStatus: 'draft',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-01-08T10:00:00Z',
  },
  {
    invoiceId: '55555555-5555-5555-5555-555555555501',
    fromStatus: 'draft',
    toStatus: 'submitted',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    invoiceId: '55555555-5555-5555-5555-555555555501',
    fromStatus: 'submitted',
    toStatus: 'under_review',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-01-11T09:00:00Z',
  },
  {
    invoiceId: '55555555-5555-5555-5555-555555555501',
    fromStatus: 'under_review',
    toStatus: 'approved',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-01-12T14:00:00Z',
  },
  {
    invoiceId: '55555555-5555-5555-5555-555555555501',
    fromStatus: 'approved',
    toStatus: 'scheduled',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-01-20T09:00:00Z',
  },
  {
    invoiceId: '55555555-5555-5555-5555-555555555501',
    fromStatus: 'scheduled',
    toStatus: 'paid',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-01-25T16:00:00Z',
  },
  // INV-2026-002: draft → submitted → approved
  {
    invoiceId: '55555555-5555-5555-5555-555555555502',
    fromStatus: 'draft',
    toStatus: 'submitted',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    invoiceId: '55555555-5555-5555-5555-555555555502',
    fromStatus: 'submitted',
    toStatus: 'approved',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-02-07T11:30:00Z',
  },
  // INV-2026-003: draft → submitted
  {
    invoiceId: '55555555-5555-5555-5555-555555555503',
    fromStatus: 'draft',
    toStatus: 'submitted',
    changedBy: SEED_ADMIN_ID,
    reason: null,
    createdAt: '2026-02-18T09:00:00Z',
  },
];

export const approvalSteps = [
  // INV-2026-001: approved by admin
  {
    invoiceId: '55555555-5555-5555-5555-555555555501',
    approverId: SEED_ADMIN_ID,
    stepOrder: 1,
    decision: 'approved' as const,
    decidedAt: '2026-01-12T14:00:00Z',
    notes: 'Looks good, approved.',
  },
  // INV-2026-002: approved by admin
  {
    invoiceId: '55555555-5555-5555-5555-555555555502',
    approverId: SEED_ADMIN_ID,
    stepOrder: 1,
    decision: 'approved' as const,
    decidedAt: '2026-02-07T11:30:00Z',
    notes: null,
  },
  // INV-2026-003: pending approval
  {
    invoiceId: '55555555-5555-5555-5555-555555555503',
    approverId: SEED_ADMIN_ID,
    stepOrder: 1,
    decision: 'pending' as const,
    decidedAt: null,
    notes: null,
  },
];
