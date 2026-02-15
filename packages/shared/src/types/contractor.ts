import type {
  ContractorStatus,
  ContractorType,
  OnboardingStepType,
  StepStatus,
  RiskLevel,
} from '../constants/state-machines';

export interface Contractor {
  id: string;
  organizationId: string;
  userId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  status: ContractorStatus;
  type: ContractorType;
  inviteToken: string | null;
  inviteExpiresAt: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  tinLastFour: string | null;
  bankName: string | null;
  bankRouting: string | null;
  bankAccountLastFour: string | null;
  bankVerified: boolean;
  activatedAt: string | null;
  offboardedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractorListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: ContractorStatus;
  type: ContractorType;
  activatedAt: string | null;
  createdAt: string;
}

export interface ContractorDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: ContractorStatus;
  type: ContractorType;
  activatedAt: string | null;
  onboarding: {
    completedSteps: number;
    totalSteps: number;
    steps: OnboardingStep[];
  };
  latestRiskAssessment: {
    overallRisk: RiskLevel;
    overallScore: number;
    assessedAt: string;
  } | null;
  activeEngagements: number;
  documentStatus: {
    hasCurrentW9: boolean;
    hasCurrentContract: boolean;
    expiringDocuments: number;
  };
  ytdPayments: number;
  createdAt: string;
}

export interface OnboardingStep {
  id: string;
  contractorId: string;
  stepType: OnboardingStepType;
  status: StepStatus;
  completedAt: string | null;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContractorStatusHistoryEntry {
  id: string;
  contractorId: string;
  status: ContractorStatus;
  changedBy: string;
  reason: string | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  createdAt: string;
}

export interface TaxSummary {
  contractorId: string;
  year: number;
  totalPaid: number;
  invoiceCount: number;
  requires1099: boolean;
}
