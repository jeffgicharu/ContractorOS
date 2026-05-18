import { randomUUID } from 'crypto';

const FIRST_NAMES = [
  'James', 'Maria', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Patricia',
  'William', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Karen',
  'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Sandra',
  'Mark', 'Ashley', 'Steven', 'Dorothy', 'Andrew', 'Kimberly', 'Paul', 'Emily',
  'Joshua', 'Donna', 'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda',
  'George', 'Stephanie', 'Timothy', 'Melissa', 'Edward', 'Rebecca', 'Jason', 'Sharon',
  'Ryan', 'Laura', 'Jacob', 'Cynthia', 'Gary', 'Kathleen', 'Nicholas', 'Amy',
  'Eric', 'Angela', 'Jonathan', 'Shirley',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
  'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter',
  'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz',
  'Edwards', 'Collins', 'Reyes', 'Stewart',
];

const CITIES: Array<[string, string, string]> = [
  ['San Francisco', 'CA', '94105'], ['Austin', 'TX', '73301'], ['Seattle', 'WA', '98101'],
  ['New York', 'NY', '10001'], ['Los Angeles', 'CA', '90001'], ['Chicago', 'IL', '60601'],
  ['Portland', 'OR', '97201'], ['Denver', 'CO', '80201'], ['Miami', 'FL', '33101'],
  ['Boston', 'MA', '02101'], ['Atlanta', 'GA', '30301'], ['Nashville', 'TN', '37201'],
  ['Phoenix', 'AZ', '85001'], ['Philadelphia', 'PA', '19101'], ['San Diego', 'CA', '92101'],
  ['Dallas', 'TX', '75201'], ['Minneapolis', 'MN', '55401'], ['Detroit', 'MI', '48201'],
  ['Charlotte', 'NC', '28201'], ['Raleigh', 'NC', '27601'],
];

const BANK_NAMES = ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'US Bank', 'PNC', 'Capital One', 'TD Bank'];

const ENGAGEMENT_TITLES = [
  'Frontend Development', 'Backend API Development', 'Mobile App Design',
  'Data Analytics Project', 'Cloud Infrastructure Setup', 'UI/UX Design Sprint',
  'Security Audit', 'DevOps Pipeline Setup', 'Marketing Site Redesign',
  'Database Migration', 'Machine Learning Integration', 'QA Automation',
  'Content Strategy', 'Brand Identity Design', 'Performance Optimization',
];

const DOCUMENT_TYPES = ['w9', 'w8ben', 'insurance_certificate', 'nda', 'contract', 'other'] as const;

export function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomDate(daysAgoStart: number, daysAgoEnd: number): string {
  const start = Date.now() - daysAgoStart * 86_400_000;
  const end = Date.now() - daysAgoEnd * 86_400_000;
  return new Date(start + Math.random() * (end - start)).toISOString();
}

export function randomDateOnly(daysAgoStart: number, daysAgoEnd: number): string {
  return randomDate(daysAgoStart, daysAgoEnd).split('T')[0]!;
}

export function generateContractor(orgId: string, idx: number) {
  const firstName = FIRST_NAMES[idx % FIRST_NAMES.length]!;
  const lastName = LAST_NAMES[idx % LAST_NAMES.length]!;
  const city = CITIES[idx % CITIES.length]!;
  const statuses = ['active', 'active', 'active', 'active', 'tax_form_pending', 'contract_pending', 'invite_sent', 'bank_details_pending', 'suspended'] as const;
  const status = statuses[idx % statuses.length]!;
  const isOnboarded = ['active', 'suspended'].includes(status);

  return {
    id: randomUUID(),
    organizationId: orgId,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@example.com`,
    firstName,
    lastName,
    status,
    type: idx % 8 === 0 ? ('foreign' as const) : ('domestic' as const),
    phone: isOnboarded ? `+1-555-${String(idx).padStart(4, '0')}` : undefined,
    city: isOnboarded ? city[0] : undefined,
    state: isOnboarded ? city[1] : undefined,
    zipCode: isOnboarded ? city[2] : undefined,
    country: idx % 8 === 0 ? 'JP' : 'US',
    tinLastFour: isOnboarded ? String(1000 + idx).slice(-4) : undefined,
    bankName: isOnboarded ? randomPick(BANK_NAMES) : undefined,
    bankAccountLastFour: isOnboarded ? String(5000 + idx).slice(-4) : undefined,
    bankVerified: isOnboarded,
  };
}

export function generateEngagement(contractorId: string, orgId: string, idx: number) {
  const statuses = ['active', 'active', 'active', 'completed', 'draft', 'paused'] as const;
  return {
    id: randomUUID(),
    contractorId,
    organizationId: orgId,
    title: ENGAGEMENT_TITLES[idx % ENGAGEMENT_TITLES.length]!,
    description: `Project engagement #${idx + 1}`,
    startDate: randomDateOnly(365, 30),
    endDate: idx % 3 === 0 ? randomDateOnly(29, 0) : null,
    hourlyRate: idx % 4 === 0 ? null : randomBetween(75, 250),
    fixedRate: idx % 4 === 0 ? randomBetween(5000, 50000) : null,
    currency: 'USD',
    paymentTerms: randomPick(['net_15', 'net_30', 'net_45']),
    status: statuses[idx % statuses.length]!,
  };
}

export function generateTimeEntries(contractorId: string, engagementId: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: randomUUID(),
    contractorId,
    engagementId,
    entryDate: randomDateOnly(90, 1),
    hours: randomBetween(1, 8) + (Math.random() > 0.5 ? 0.5 : 0),
    description: `Work item ${i + 1}`,
  }));
}

export function generateInvoice(
  contractorId: string,
  engagementId: string,
  orgId: string,
  invoiceNum: number,
  status: string,
  monthsAgo?: number,
) {
  const now = Date.now();
  const DAY = 86_400_000;

  // Lifecycle gaps, then anchor `submitted` far enough in the past that the
  // whole chain (submit → approve → schedule → pay) always lands before now —
  // an invoice must never be "paid" with a future paid_at.
  const gApprove = randomBetween(1, 5);
  const gSchedule = randomBetween(1, 3);
  const gPay = randomBetween(1, 7);
  const wantApprove = ['approved', 'scheduled', 'paid'].includes(status);
  const wantSchedule = ['scheduled', 'paid'].includes(status);
  const wantPaid = status === 'paid';
  const chainDays =
    (wantApprove ? gApprove : 0) +
    (wantSchedule ? gSchedule : 0) +
    (wantPaid ? gPay : 0);

  const requestedOffset =
    monthsAgo !== undefined
      ? monthsAgo * 30 + randomBetween(1, 25)
      : randomBetween(20, 180);
  // Keep at least 2 days of headroom after the final lifecycle step.
  const baseOffset = Math.max(requestedOffset, chainDays + 2);

  const submittedMs = now - baseOffset * DAY;
  const submitted = status !== 'draft' ? new Date(submittedMs).toISOString() : null;
  const approved = wantApprove
    ? new Date(submittedMs + gApprove * DAY).toISOString()
    : null;
  const scheduled = wantSchedule
    ? new Date(submittedMs + (gApprove + gSchedule) * DAY).toISOString()
    : null;
  const paid = wantPaid
    ? new Date(submittedMs + (gApprove + gSchedule + gPay) * DAY).toISOString()
    : null;

  const lineItemCount = randomBetween(1, 4);
  const lineItems = Array.from({ length: lineItemCount }, (_, i) => ({
    description: `Service item ${i + 1}`,
    quantity: randomBetween(4, 40),
    unitPrice: randomBetween(50, 200),
  }));

  // Billing period sits before submission; due 30 days after submission
  // (net-30), or for drafts, 15 days out from a recent period.
  const periodEndMs = (submitted ? submittedMs : now) - randomBetween(2, 7) * DAY;
  const periodStartMs = periodEndMs - 30 * DAY;
  const dueMs = submitted ? submittedMs + 30 * DAY : now + 15 * DAY;

  return {
    id: randomUUID(),
    contractorId,
    engagementId,
    organizationId: orgId,
    invoiceNumber: `INV-2026-${String(invoiceNum).padStart(3, '0')}`,
    status,
    submittedAt: submitted,
    approvedAt: approved,
    scheduledAt: scheduled,
    paidAt: paid,
    dueDate: new Date(dueMs).toISOString().split('T')[0]!,
    notes: null,
    periodStart: new Date(periodStartMs).toISOString().split('T')[0]!,
    periodEnd: new Date(periodEndMs).toISOString().split('T')[0]!,
    lineItems,
  };
}

export type ComplianceBucket = 'compliant' | 'expiring' | 'noncompliant';

export interface SeedDocument {
  id: string;
  contractorId: string;
  organizationId: string;
  documentType: (typeof DOCUMENT_TYPES)[number];
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  expiresAt: string | null;
  tinLastFour: string | null;
  isCurrent: boolean;
  version: number;
  notes: string | null;
  createdAt: string;
}

function makeDoc(
  contractorId: string,
  orgId: string,
  uploadedBy: string,
  documentType: (typeof DOCUMENT_TYPES)[number],
  opts: {
    expiresInDays: number | null;
    isCurrent?: boolean;
    version?: number;
    tinLastFour?: string | null;
    createdDaysAgo: number;
  },
): SeedDocument {
  return {
    id: randomUUID(),
    contractorId,
    organizationId: orgId,
    documentType,
    filePath: `${orgId}/${contractorId}/${randomUUID()}.pdf`,
    fileName: `${documentType}.pdf`,
    fileSizeBytes: randomBetween(48_000, 480_000),
    mimeType: 'application/pdf',
    uploadedBy,
    expiresAt:
      opts.expiresInDays === null
        ? null
        : new Date(Date.now() + opts.expiresInDays * 86_400_000).toISOString(),
    tinLastFour: opts.tinLastFour ?? null,
    isCurrent: opts.isCurrent ?? true,
    version: opts.version ?? 1,
    notes: null,
    createdAt: new Date(Date.now() - opts.createdDaysAgo * 86_400_000).toISOString(),
  };
}

/**
 * Builds a coherent document set for an onboarded contractor. The bucket is
 * assigned deterministically by the caller so the org-wide compliance rate is
 * stable across reseeds. Every document a contractor gets is internally
 * consistent: a "compliant" contractor's W-9/W-8BEN is genuinely current and
 * far from expiry (so the profile tab, documents tab, and compliance report all
 * agree), an "expiring" contractor's required tax form is current but inside
 * the 30-day window, and a "noncompliant" contractor is missing exactly one
 * required document.
 */
export function generateContractorDocuments(
  contractorId: string,
  orgId: string,
  uploadedBy: string,
  contractorType: 'domestic' | 'foreign',
  bucket: ComplianceBucket,
  idx: number,
  tinLastFour: string | null,
): SeedDocument[] {
  const taxType = contractorType === 'foreign' ? 'w8ben' : 'w9';
  const docs: SeedDocument[] = [];
  const taxTin = contractorType === 'foreign' ? null : tinLastFour;

  if (bucket === 'compliant') {
    docs.push(
      makeDoc(contractorId, orgId, uploadedBy, taxType, {
        expiresInDays: 365 + (idx % 12) * 24,
        tinLastFour: taxTin,
        createdDaysAgo: 90 + (idx % 60),
      }),
    );
    docs.push(
      makeDoc(contractorId, orgId, uploadedBy, 'contract', {
        expiresInDays: null,
        createdDaysAgo: 88 + (idx % 60),
      }),
    );
    if (idx % 2 === 0) {
      docs.push(
        makeDoc(contractorId, orgId, uploadedBy, 'nda', {
          expiresInDays: null,
          createdDaysAgo: 80 + (idx % 40),
        }),
      );
    }
    if (idx % 3 === 0) {
      docs.push(
        makeDoc(contractorId, orgId, uploadedBy, 'insurance_certificate', {
          expiresInDays: 150 + (idx % 9) * 20,
          createdDaysAgo: 70 + (idx % 30),
        }),
      );
    }
    // A superseded prior version, so version history looks real.
    if (idx % 5 === 0) {
      docs.push(
        makeDoc(contractorId, orgId, uploadedBy, taxType, {
          expiresInDays: -120,
          isCurrent: false,
          version: 1,
          tinLastFour: taxTin,
          createdDaysAgo: 430 + (idx % 60),
        }),
      );
      docs[0]!.version = 2;
    }
  } else if (bucket === 'expiring') {
    docs.push(
      makeDoc(contractorId, orgId, uploadedBy, taxType, {
        expiresInDays: 6 + (idx % 21),
        tinLastFour: taxTin,
        createdDaysAgo: 330 + (idx % 30),
      }),
    );
    docs.push(
      makeDoc(contractorId, orgId, uploadedBy, 'contract', {
        expiresInDays: null,
        createdDaysAgo: 120 + (idx % 40),
      }),
    );
    if (idx % 2 === 0) {
      docs.push(
        makeDoc(contractorId, orgId, uploadedBy, 'insurance_certificate', {
          expiresInDays: 9 + (idx % 18),
          createdDaysAgo: 200 + (idx % 30),
        }),
      );
    }
  } else {
    // Missing exactly one required document — alternate which one.
    if (idx % 2 === 0) {
      docs.push(
        makeDoc(contractorId, orgId, uploadedBy, taxType, {
          expiresInDays: 365 + (idx % 6) * 30,
          tinLastFour: taxTin,
          createdDaysAgo: 40 + (idx % 30),
        }),
      );
      if (idx % 3 === 0) {
        docs.push(
          makeDoc(contractorId, orgId, uploadedBy, 'nda', {
            expiresInDays: null,
            createdDaysAgo: 35 + (idx % 20),
          }),
        );
      }
    } else {
      docs.push(
        makeDoc(contractorId, orgId, uploadedBy, 'contract', {
          expiresInDays: null,
          createdDaysAgo: 30 + (idx % 25),
        }),
      );
    }
  }

  return docs;
}

/**
 * A believable activity stream. Invoice lifecycle events are pinned to the
 * invoice's own timestamps so an invoice is never "paid" before it was
 * "submitted"; everything else is spread across the trailing window with
 * realistic actors.
 */
export interface SeedAuditEvent {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
}

interface AuditUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'contractor';
}

interface AuditInvoiceRef {
  id: string;
  invoiceNumber: string;
  status: string;
  contractorName: string;
  submittedAt: string | null;
  approvedAt: string | null;
  scheduledAt: string | null;
  paidAt: string | null;
}

interface AuditContractorRef {
  id: string;
  name: string;
  createdAt: string;
  status: string;
}

const AUDIT_IPS = ['203.0.113.24', '198.51.100.7', '203.0.113.91', '198.51.100.45', '192.0.2.130'];

function auditDay(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  d.setUTCHours(13 + randomBetween(-4, 6), randomBetween(0, 59), randomBetween(0, 59), 0);
  // Never emit a future-dated event (matters for daysAgo === 0).
  const ms = Math.min(d.getTime(), Date.now() - 60_000);
  return new Date(ms).toISOString();
}

export function generateAuditEvents(
  users: AuditUser[],
  contractors: AuditContractorRef[],
  invoices: AuditInvoiceRef[],
  offboardingIds: string[],
): SeedAuditEvent[] {
  const events: SeedAuditEvent[] = [];
  const admin = users.find((u) => u.role === 'admin')!;
  const manager = users.find((u) => u.role === 'manager')!;
  const staff = [admin, manager];
  const ip = () => randomPick(AUDIT_IPS);

  // Daily-ish staff logins across the trailing 75 days.
  for (let d = 75; d >= 0; d--) {
    if (Math.random() < 0.28) continue;
    const logins = randomBetween(1, 3);
    for (let i = 0; i < logins; i++) {
      const u = randomPick(staff);
      events.push({
        userId: u.id,
        entityType: 'auth',
        entityId: u.id,
        action: 'login',
        oldValues: null,
        newValues: { email: u.email, method: 'password' },
        ipAddress: ip(),
        createdAt: auditDay(d),
      });
    }
  }

  // Invoice lifecycle — pinned to the invoice's own timestamps.
  for (const inv of invoices) {
    if (inv.submittedAt) {
      events.push({
        userId: manager.id,
        entityType: 'invoices',
        entityId: inv.id,
        action: 'submit',
        oldValues: { status: 'draft' },
        newValues: { status: 'submitted', invoiceNumber: inv.invoiceNumber, contractor: inv.contractorName },
        ipAddress: ip(),
        createdAt: inv.submittedAt,
      });
    }
    if (inv.approvedAt) {
      events.push({
        userId: admin.id,
        entityType: 'invoices',
        entityId: inv.id,
        action: 'approve',
        oldValues: { status: 'submitted' },
        newValues: { status: 'approved', invoiceNumber: inv.invoiceNumber },
        ipAddress: ip(),
        createdAt: inv.approvedAt,
      });
    }
    if (inv.scheduledAt) {
      events.push({
        userId: admin.id,
        entityType: 'invoices',
        entityId: inv.id,
        action: 'schedule',
        oldValues: { status: 'approved' },
        newValues: { status: 'scheduled', invoiceNumber: inv.invoiceNumber },
        ipAddress: ip(),
        createdAt: inv.scheduledAt,
      });
    }
    if (inv.paidAt) {
      events.push({
        userId: admin.id,
        entityType: 'invoices',
        entityId: inv.id,
        action: 'mark-paid',
        oldValues: { status: 'scheduled' },
        newValues: { status: 'paid', invoiceNumber: inv.invoiceNumber },
        ipAddress: ip(),
        createdAt: inv.paidAt,
      });
    }
  }

  // Contractor lifecycle changes, never dated before the contractor existed.
  for (let i = 0; i < contractors.length; i += 2) {
    const c = contractors[i]!;
    const createdDaysAgo = Math.max(
      1,
      Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86_400_000),
    );
    if (createdDaysAgo < 2) continue;
    const eventDaysAgo = randomBetween(1, Math.min(createdDaysAgo - 1, 70));
    const u = randomPick(staff);
    if (c.status === 'suspended') {
      events.push({
        userId: u.id,
        entityType: 'contractors',
        entityId: c.id,
        action: 'update',
        oldValues: { status: 'active' },
        newValues: { status: 'suspended', reason: 'Compliance review' },
        ipAddress: ip(),
        createdAt: auditDay(eventDaysAgo),
      });
    } else {
      events.push({
        userId: u.id,
        entityType: 'contractors',
        entityId: c.id,
        action: 'update',
        oldValues: { phone: null },
        newValues: { phone: '+1-555-0100', city: 'Austin' },
        ipAddress: ip(),
        createdAt: auditDay(eventDaysAgo),
      });
    }
  }

  // Document uploads.
  for (let i = 0; i < contractors.length; i += 3) {
    const c = contractors[i]!;
    events.push({
      userId: randomPick(staff).id,
      entityType: 'documents',
      entityId: c.id,
      action: 'create',
      oldValues: null,
      newValues: { type: randomPick(['w9', 'contract', 'insurance_certificate', 'nda']), contractor: c.name },
      ipAddress: ip(),
      createdAt: auditDay(randomBetween(1, 70)),
    });
  }

  // Offboarding initiations.
  for (const wfId of offboardingIds) {
    events.push({
      userId: admin.id,
      entityType: 'offboarding',
      entityId: wfId,
      action: 'create',
      oldValues: null,
      newValues: { reason: randomPick(['project_completed', 'mutual_agreement', 'budget_cut']) },
      ipAddress: ip(),
      createdAt: auditDay(randomBetween(1, 55)),
    });
  }

  // Organization settings updates (rich diff for the diff viewer).
  events.push({
    userId: admin.id,
    entityType: 'organizations',
    entityId: admin.id,
    action: 'update',
    oldValues: { settings: { defaultPaymentTerms: 'net_15', defaultCurrency: 'USD', reminderDays: [7, 1] } },
    newValues: { settings: { defaultPaymentTerms: 'net_30', defaultCurrency: 'USD', reminderDays: [7, 3, 1] } },
    ipAddress: ip(),
    createdAt: auditDay(randomBetween(40, 70)),
  });

  // Classification re-runs.
  for (let i = 0; i < Math.min(8, contractors.length); i++) {
    const c = contractors[i * 4 % contractors.length]!;
    events.push({
      userId: admin.id,
      entityType: 'classification',
      entityId: c.id,
      action: 'create',
      oldValues: null,
      newValues: { overallRisk: randomPick(['low', 'medium', 'high']), contractor: c.name },
      ipAddress: ip(),
      createdAt: auditDay(randomBetween(1, 60)),
    });
  }

  return events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function generateNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  return { userId, type, title, body, data };
}

export { ENGAGEMENT_TITLES, DOCUMENT_TYPES };
