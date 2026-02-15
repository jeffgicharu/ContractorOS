import type { InvoiceStatus, ApprovalDecision } from '../constants/state-machines';

export interface Invoice {
  id: string;
  contractorId: string;
  engagementId: string;
  organizationId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  scheduledAt: string | null;
  paidAt: string | null;
  dueDate: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  contractorName: string;
  totalAmount: number;
  currency: string;
  dueDate: string | null;
  periodStart: string;
  periodEnd: string;
  submittedAt: string | null;
  createdAt: string;
}

export interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  contractor: { id: string; name: string };
  engagement: { id: string; title: string };
  periodStart: string;
  periodEnd: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  dueDate: string | null;
  notes: string | null;
  approvalSteps: ApprovalStep[];
  statusHistory: InvoiceStatusHistoryEntry[];
  actions: string[];
  submittedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  timeEntryId: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ApprovalStep {
  id: string;
  invoiceId: string;
  approverId: string;
  approverName?: string;
  stepOrder: number;
  decision: ApprovalDecision;
  decidedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InvoiceStatusHistoryEntry {
  id: string;
  invoiceId: string;
  fromStatus: InvoiceStatus | null;
  toStatus: InvoiceStatus;
  changedBy: string;
  reason: string | null;
  createdAt: string;
}
