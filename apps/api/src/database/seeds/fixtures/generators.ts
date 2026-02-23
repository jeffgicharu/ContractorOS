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
  // Spread invoices across multiple months for richer chart data
  const baseOffset = monthsAgo !== undefined
    ? monthsAgo * 30 + randomBetween(1, 25)
    : randomBetween(10, 180);
  const submitted = status !== 'draft' ? new Date(now - baseOffset * 86_400_000).toISOString() : null;
  const approved = ['approved', 'scheduled', 'paid'].includes(status)
    ? new Date(new Date(submitted!).getTime() + randomBetween(1, 5) * 86_400_000).toISOString()
    : null;
  const scheduled = ['scheduled', 'paid'].includes(status)
    ? new Date(new Date(approved!).getTime() + randomBetween(1, 3) * 86_400_000).toISOString()
    : null;
  const paid = status === 'paid'
    ? new Date(new Date(scheduled!).getTime() + randomBetween(1, 7) * 86_400_000).toISOString()
    : null;

  const lineItemCount = randomBetween(1, 4);
  const lineItems = Array.from({ length: lineItemCount }, (_, i) => ({
    description: `Service item ${i + 1}`,
    quantity: randomBetween(4, 40),
    unitPrice: randomBetween(50, 200),
  }));

  const periodOffset = baseOffset + randomBetween(0, 30);

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
    dueDate: new Date(now - (baseOffset - 30) * 86_400_000).toISOString().split('T')[0]!,
    notes: null,
    periodStart: new Date(now - periodOffset * 86_400_000).toISOString().split('T')[0]!,
    periodEnd: new Date(now - (periodOffset - 30) * 86_400_000).toISOString().split('T')[0]!,
    lineItems,
  };
}

export function generateDocument(contractorId: string, orgId: string, uploadedBy: string, idx: number) {
  const docType = DOCUMENT_TYPES[idx % DOCUMENT_TYPES.length]!;
  const expiresInDays = idx % 5 === 0 ? randomBetween(-30, 10) : randomBetween(30, 365);

  return {
    id: randomUUID(),
    contractorId,
    organizationId: orgId,
    documentType: docType,
    filePath: `${orgId}/${contractorId}/${randomUUID()}.pdf`,
    fileName: `${docType}_${idx}.pdf`,
    fileSizeBytes: randomBetween(10000, 500000),
    mimeType: 'application/pdf',
    uploadedBy,
    expiresAt: docType !== 'other' ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString() : null,
    tinLastFour: docType === 'w9' ? String(1000 + idx).slice(-4) : null,
    isCurrent: true,
    version: 1,
    notes: null,
  };
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
