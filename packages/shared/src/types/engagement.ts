import type { EngagementStatus, PaymentTerms } from '../constants/state-machines';

export interface Engagement {
  id: string;
  contractorId: string;
  organizationId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  hourlyRate: number | null;
  fixedRate: number | null;
  currency: string;
  paymentTerms: PaymentTerms;
  status: EngagementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  contractorId: string;
  engagementId: string;
  entryDate: string;
  hours: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}
