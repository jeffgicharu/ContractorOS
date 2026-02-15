// ─── Contractor Status ───────────────────────────────────────────

export const ContractorStatus = {
  INVITE_SENT: 'invite_sent',
  TAX_FORM_PENDING: 'tax_form_pending',
  CONTRACT_PENDING: 'contract_pending',
  BANK_DETAILS_PENDING: 'bank_details_pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  OFFBOARDED: 'offboarded',
} as const;

export type ContractorStatus = (typeof ContractorStatus)[keyof typeof ContractorStatus];

export const CONTRACTOR_TRANSITIONS: Record<ContractorStatus, readonly ContractorStatus[]> = {
  [ContractorStatus.INVITE_SENT]: [ContractorStatus.TAX_FORM_PENDING, ContractorStatus.OFFBOARDED],
  [ContractorStatus.TAX_FORM_PENDING]: [ContractorStatus.CONTRACT_PENDING],
  [ContractorStatus.CONTRACT_PENDING]: [ContractorStatus.BANK_DETAILS_PENDING],
  [ContractorStatus.BANK_DETAILS_PENDING]: [ContractorStatus.ACTIVE],
  [ContractorStatus.ACTIVE]: [ContractorStatus.SUSPENDED, ContractorStatus.OFFBOARDED],
  [ContractorStatus.SUSPENDED]: [ContractorStatus.ACTIVE, ContractorStatus.OFFBOARDED],
  [ContractorStatus.OFFBOARDED]: [],
};

export const ONBOARDING_STATUSES: readonly ContractorStatus[] = [
  ContractorStatus.INVITE_SENT,
  ContractorStatus.TAX_FORM_PENDING,
  ContractorStatus.CONTRACT_PENDING,
  ContractorStatus.BANK_DETAILS_PENDING,
];

// ─── Invoice Status ──────────────────────────────────────────────

export const InvoiceStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  SCHEDULED: 'scheduled',
  PAID: 'paid',
  DISPUTED: 'disputed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.SUBMITTED, InvoiceStatus.CANCELLED],
  [InvoiceStatus.SUBMITTED]: [InvoiceStatus.UNDER_REVIEW, InvoiceStatus.CANCELLED],
  [InvoiceStatus.UNDER_REVIEW]: [
    InvoiceStatus.APPROVED,
    InvoiceStatus.REJECTED,
    InvoiceStatus.CANCELLED,
  ],
  [InvoiceStatus.APPROVED]: [InvoiceStatus.SCHEDULED, InvoiceStatus.DISPUTED],
  [InvoiceStatus.SCHEDULED]: [InvoiceStatus.PAID, InvoiceStatus.DISPUTED],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.DISPUTED]: [InvoiceStatus.UNDER_REVIEW],
  [InvoiceStatus.REJECTED]: [],
  [InvoiceStatus.CANCELLED]: [],
};

export const INVOICE_TERMINAL_STATUSES: readonly InvoiceStatus[] = [
  InvoiceStatus.PAID,
  InvoiceStatus.REJECTED,
  InvoiceStatus.CANCELLED,
];

// ─── Offboarding Status ──────────────────────────────────────────

export const OffboardingStatus = {
  INITIATED: 'initiated',
  IN_PROGRESS: 'in_progress',
  PENDING_FINAL_INVOICE: 'pending_final_invoice',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OffboardingStatus = (typeof OffboardingStatus)[keyof typeof OffboardingStatus];

export const OFFBOARDING_TRANSITIONS: Record<OffboardingStatus, readonly OffboardingStatus[]> = {
  [OffboardingStatus.INITIATED]: [OffboardingStatus.IN_PROGRESS, OffboardingStatus.CANCELLED],
  [OffboardingStatus.IN_PROGRESS]: [
    OffboardingStatus.PENDING_FINAL_INVOICE,
    OffboardingStatus.COMPLETED,
  ],
  [OffboardingStatus.PENDING_FINAL_INVOICE]: [OffboardingStatus.COMPLETED],
  [OffboardingStatus.COMPLETED]: [],
  [OffboardingStatus.CANCELLED]: [],
};

// ─── Engagement Status ───────────────────────────────────────────

export const EngagementStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type EngagementStatus = (typeof EngagementStatus)[keyof typeof EngagementStatus];

export const ENGAGEMENT_TRANSITIONS: Record<EngagementStatus, readonly EngagementStatus[]> = {
  [EngagementStatus.DRAFT]: [EngagementStatus.ACTIVE, EngagementStatus.CANCELLED],
  [EngagementStatus.ACTIVE]: [EngagementStatus.PAUSED, EngagementStatus.COMPLETED],
  [EngagementStatus.PAUSED]: [EngagementStatus.ACTIVE, EngagementStatus.CANCELLED],
  [EngagementStatus.COMPLETED]: [],
  [EngagementStatus.CANCELLED]: [],
};

// ─── Other Enums ─────────────────────────────────────────────────

export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CONTRACTOR: 'contractor',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ContractorType = {
  DOMESTIC: 'domestic',
  FOREIGN: 'foreign',
} as const;

export type ContractorType = (typeof ContractorType)[keyof typeof ContractorType];

export const PaymentTerms = {
  NET_15: 'net_15',
  NET_30: 'net_30',
  NET_45: 'net_45',
  NET_60: 'net_60',
} as const;

export type PaymentTerms = (typeof PaymentTerms)[keyof typeof PaymentTerms];

export const PAYMENT_TERMS_DAYS: Record<PaymentTerms, number> = {
  [PaymentTerms.NET_15]: 15,
  [PaymentTerms.NET_30]: 30,
  [PaymentTerms.NET_45]: 45,
  [PaymentTerms.NET_60]: 60,
};

export const ApprovalDecision = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ApprovalDecision = (typeof ApprovalDecision)[keyof typeof ApprovalDecision];

export const OnboardingStepType = {
  INVITE_ACCEPTED: 'invite_accepted',
  TAX_FORM_SUBMITTED: 'tax_form_submitted',
  CONTRACT_SIGNED: 'contract_signed',
  BANK_DETAILS_SUBMITTED: 'bank_details_submitted',
} as const;

export type OnboardingStepType = (typeof OnboardingStepType)[keyof typeof OnboardingStepType];

export const StepStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
} as const;

export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

export const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const RISK_THRESHOLDS: Record<RiskLevel, { min: number; max: number }> = {
  [RiskLevel.LOW]: { min: 0, max: 24 },
  [RiskLevel.MEDIUM]: { min: 25, max: 49 },
  [RiskLevel.HIGH]: { min: 50, max: 74 },
  [RiskLevel.CRITICAL]: { min: 75, max: 100 },
};

export const OffboardingReason = {
  PROJECT_COMPLETED: 'project_completed',
  BUDGET_CUT: 'budget_cut',
  PERFORMANCE: 'performance',
  MUTUAL_AGREEMENT: 'mutual_agreement',
  COMPLIANCE_RISK: 'compliance_risk',
  OTHER: 'other',
} as const;

export type OffboardingReason = (typeof OffboardingReason)[keyof typeof OffboardingReason];

export const ChecklistItemType = {
  REVOKE_SYSTEM_ACCESS: 'revoke_system_access',
  REVOKE_CODE_REPO_ACCESS: 'revoke_code_repo_access',
  REVOKE_COMMUNICATION_TOOLS: 'revoke_communication_tools',
  RETRIEVE_EQUIPMENT: 'retrieve_equipment',
  PROCESS_FINAL_INVOICE: 'process_final_invoice',
  ARCHIVE_DOCUMENTS: 'archive_documents',
  FREEZE_TAX_DATA: 'freeze_tax_data',
  EXIT_INTERVIEW: 'exit_interview',
  REMOVE_FROM_TOOLS: 'remove_from_tools',
} as const;

export type ChecklistItemType = (typeof ChecklistItemType)[keyof typeof ChecklistItemType];

export const ChecklistStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  NOT_APPLICABLE: 'not_applicable',
} as const;

export type ChecklistStatus = (typeof ChecklistStatus)[keyof typeof ChecklistStatus];

export const EquipmentStatus = {
  ASSIGNED: 'assigned',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  LOST: 'lost',
} as const;

export type EquipmentStatus = (typeof EquipmentStatus)[keyof typeof EquipmentStatus];

export const NotificationType = {
  ONBOARDING_REMINDER: 'onboarding_reminder',
  INVOICE_SUBMITTED: 'invoice_submitted',
  INVOICE_APPROVED: 'invoice_approved',
  INVOICE_REJECTED: 'invoice_rejected',
  INVOICE_PAID: 'invoice_paid',
  DOCUMENT_EXPIRING: 'document_expiring',
  DOCUMENT_EXPIRED: 'document_expired',
  CLASSIFICATION_RISK_CHANGE: 'classification_risk_change',
  OFFBOARDING_STARTED: 'offboarding_started',
  OFFBOARDING_ACTION_REQUIRED: 'offboarding_action_required',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ─── Transition Validator ────────────────────────────────────────

export function isValidTransition<T extends string>(
  transitions: Record<T, readonly T[]>,
  from: T,
  to: T,
): boolean {
  const allowed = transitions[from];
  return allowed !== undefined && allowed.includes(to);
}
