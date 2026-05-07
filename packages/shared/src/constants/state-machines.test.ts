import { describe, it, expect } from 'vitest';
import {
  ContractorStatus,
  CONTRACTOR_TRANSITIONS,
  ONBOARDING_STATUSES,
  InvoiceStatus,
  INVOICE_TRANSITIONS,
  INVOICE_TERMINAL_STATUSES,
  OffboardingStatus,
  OFFBOARDING_TRANSITIONS,
  EngagementStatus,
  ENGAGEMENT_TRANSITIONS,
  PaymentTerms,
  PAYMENT_TERMS_DAYS,
  RiskLevel,
  RISK_THRESHOLDS,
  isValidTransition,
} from './state-machines';

describe('isValidTransition', () => {
  it('returns true when the destination is in the from-state allow list', () => {
    expect(
      isValidTransition(CONTRACTOR_TRANSITIONS, ContractorStatus.INVITE_SENT, ContractorStatus.TAX_FORM_PENDING),
    ).toBe(true);
  });

  it('returns false when the destination is not in the from-state allow list', () => {
    expect(
      isValidTransition(CONTRACTOR_TRANSITIONS, ContractorStatus.INVITE_SENT, ContractorStatus.ACTIVE),
    ).toBe(false);
  });

  it('returns false from a terminal state', () => {
    expect(
      isValidTransition(CONTRACTOR_TRANSITIONS, ContractorStatus.OFFBOARDED, ContractorStatus.ACTIVE),
    ).toBe(false);
  });
});

describe('Contractor 7-state machine', () => {
  const validEdges: Array<[ContractorStatus, ContractorStatus]> = [
    [ContractorStatus.INVITE_SENT, ContractorStatus.TAX_FORM_PENDING],
    [ContractorStatus.INVITE_SENT, ContractorStatus.OFFBOARDED],
    [ContractorStatus.TAX_FORM_PENDING, ContractorStatus.CONTRACT_PENDING],
    [ContractorStatus.CONTRACT_PENDING, ContractorStatus.BANK_DETAILS_PENDING],
    [ContractorStatus.BANK_DETAILS_PENDING, ContractorStatus.ACTIVE],
    [ContractorStatus.ACTIVE, ContractorStatus.SUSPENDED],
    [ContractorStatus.ACTIVE, ContractorStatus.OFFBOARDED],
    [ContractorStatus.SUSPENDED, ContractorStatus.ACTIVE],
    [ContractorStatus.SUSPENDED, ContractorStatus.OFFBOARDED],
  ];

  it.each(validEdges)('allows %s -> %s', (from, to) => {
    expect(isValidTransition(CONTRACTOR_TRANSITIONS, from, to)).toBe(true);
  });

  const illegalEdges: Array<[ContractorStatus, ContractorStatus]> = [
    [ContractorStatus.INVITE_SENT, ContractorStatus.ACTIVE],
    [ContractorStatus.TAX_FORM_PENDING, ContractorStatus.ACTIVE],
    [ContractorStatus.OFFBOARDED, ContractorStatus.ACTIVE],
    [ContractorStatus.OFFBOARDED, ContractorStatus.INVITE_SENT],
    [ContractorStatus.ACTIVE, ContractorStatus.TAX_FORM_PENDING],
  ];

  it.each(illegalEdges)('rejects %s -> %s', (from, to) => {
    expect(isValidTransition(CONTRACTOR_TRANSITIONS, from, to)).toBe(false);
  });

  it('exposes the 4 onboarding statuses in order', () => {
    expect(ONBOARDING_STATUSES).toEqual([
      ContractorStatus.INVITE_SENT,
      ContractorStatus.TAX_FORM_PENDING,
      ContractorStatus.CONTRACT_PENDING,
      ContractorStatus.BANK_DETAILS_PENDING,
    ]);
  });
});

describe('Invoice 9-state machine', () => {
  const validEdges: Array<[InvoiceStatus, InvoiceStatus]> = [
    [InvoiceStatus.DRAFT, InvoiceStatus.SUBMITTED],
    [InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED],
    [InvoiceStatus.SUBMITTED, InvoiceStatus.UNDER_REVIEW],
    [InvoiceStatus.SUBMITTED, InvoiceStatus.CANCELLED],
    [InvoiceStatus.UNDER_REVIEW, InvoiceStatus.APPROVED],
    [InvoiceStatus.UNDER_REVIEW, InvoiceStatus.REJECTED],
    [InvoiceStatus.UNDER_REVIEW, InvoiceStatus.CANCELLED],
    [InvoiceStatus.APPROVED, InvoiceStatus.SCHEDULED],
    [InvoiceStatus.APPROVED, InvoiceStatus.DISPUTED],
    [InvoiceStatus.SCHEDULED, InvoiceStatus.PAID],
    [InvoiceStatus.SCHEDULED, InvoiceStatus.DISPUTED],
    [InvoiceStatus.DISPUTED, InvoiceStatus.UNDER_REVIEW],
  ];

  it.each(validEdges)('allows %s -> %s', (from, to) => {
    expect(isValidTransition(INVOICE_TRANSITIONS, from, to)).toBe(true);
  });

  const illegalEdges: Array<[InvoiceStatus, InvoiceStatus]> = [
    [InvoiceStatus.DRAFT, InvoiceStatus.APPROVED],
    [InvoiceStatus.DRAFT, InvoiceStatus.PAID],
    [InvoiceStatus.SUBMITTED, InvoiceStatus.PAID],
    [InvoiceStatus.PAID, InvoiceStatus.DRAFT],
    [InvoiceStatus.PAID, InvoiceStatus.SCHEDULED],
    [InvoiceStatus.REJECTED, InvoiceStatus.SUBMITTED],
    [InvoiceStatus.CANCELLED, InvoiceStatus.DRAFT],
  ];

  it.each(illegalEdges)('rejects %s -> %s', (from, to) => {
    expect(isValidTransition(INVOICE_TRANSITIONS, from, to)).toBe(false);
  });

  it('marks paid, rejected, and cancelled as terminal', () => {
    expect(INVOICE_TERMINAL_STATUSES).toEqual(
      expect.arrayContaining([
        InvoiceStatus.PAID,
        InvoiceStatus.REJECTED,
        InvoiceStatus.CANCELLED,
      ]),
    );
    for (const terminal of INVOICE_TERMINAL_STATUSES) {
      expect(INVOICE_TRANSITIONS[terminal]).toEqual([]);
    }
  });
});

describe('Engagement 5-state machine', () => {
  const validEdges: Array<[EngagementStatus, EngagementStatus]> = [
    [EngagementStatus.DRAFT, EngagementStatus.ACTIVE],
    [EngagementStatus.DRAFT, EngagementStatus.CANCELLED],
    [EngagementStatus.ACTIVE, EngagementStatus.PAUSED],
    [EngagementStatus.ACTIVE, EngagementStatus.COMPLETED],
    [EngagementStatus.PAUSED, EngagementStatus.ACTIVE],
    [EngagementStatus.PAUSED, EngagementStatus.CANCELLED],
  ];

  it.each(validEdges)('allows %s -> %s', (from, to) => {
    expect(isValidTransition(ENGAGEMENT_TRANSITIONS, from, to)).toBe(true);
  });

  const illegalEdges: Array<[EngagementStatus, EngagementStatus]> = [
    [EngagementStatus.DRAFT, EngagementStatus.COMPLETED],
    [EngagementStatus.COMPLETED, EngagementStatus.ACTIVE],
    [EngagementStatus.CANCELLED, EngagementStatus.DRAFT],
  ];

  it.each(illegalEdges)('rejects %s -> %s', (from, to) => {
    expect(isValidTransition(ENGAGEMENT_TRANSITIONS, from, to)).toBe(false);
  });
});

describe('Offboarding 5-state machine', () => {
  const validEdges: Array<[OffboardingStatus, OffboardingStatus]> = [
    [OffboardingStatus.INITIATED, OffboardingStatus.IN_PROGRESS],
    [OffboardingStatus.INITIATED, OffboardingStatus.CANCELLED],
    [OffboardingStatus.IN_PROGRESS, OffboardingStatus.PENDING_FINAL_INVOICE],
    [OffboardingStatus.IN_PROGRESS, OffboardingStatus.COMPLETED],
    [OffboardingStatus.IN_PROGRESS, OffboardingStatus.CANCELLED],
    [OffboardingStatus.PENDING_FINAL_INVOICE, OffboardingStatus.COMPLETED],
    [OffboardingStatus.PENDING_FINAL_INVOICE, OffboardingStatus.CANCELLED],
  ];

  it.each(validEdges)('allows %s -> %s', (from, to) => {
    expect(isValidTransition(OFFBOARDING_TRANSITIONS, from, to)).toBe(true);
  });

  it('rejects transitions out of completed', () => {
    expect(
      isValidTransition(OFFBOARDING_TRANSITIONS, OffboardingStatus.COMPLETED, OffboardingStatus.IN_PROGRESS),
    ).toBe(false);
  });
});

describe('Constants', () => {
  it('PAYMENT_TERMS_DAYS maps each term to the correct day count', () => {
    expect(PAYMENT_TERMS_DAYS[PaymentTerms.NET_15]).toBe(15);
    expect(PAYMENT_TERMS_DAYS[PaymentTerms.NET_30]).toBe(30);
    expect(PAYMENT_TERMS_DAYS[PaymentTerms.NET_45]).toBe(45);
    expect(PAYMENT_TERMS_DAYS[PaymentTerms.NET_60]).toBe(60);
  });

  it.each([
    [RiskLevel.LOW, 0, 24],
    [RiskLevel.MEDIUM, 25, 49],
    [RiskLevel.HIGH, 50, 74],
    [RiskLevel.CRITICAL, 75, 100],
  ])('RISK_THRESHOLDS for %s span [%i, %i]', (level, min, max) => {
    expect(RISK_THRESHOLDS[level]).toEqual({ min, max });
  });

  it('RISK_THRESHOLDS bands are contiguous and cover 0..100', () => {
    expect(RISK_THRESHOLDS[RiskLevel.LOW].min).toBe(0);
    expect(RISK_THRESHOLDS[RiskLevel.CRITICAL].max).toBe(100);
    expect(RISK_THRESHOLDS[RiskLevel.LOW].max + 1).toBe(RISK_THRESHOLDS[RiskLevel.MEDIUM].min);
    expect(RISK_THRESHOLDS[RiskLevel.MEDIUM].max + 1).toBe(RISK_THRESHOLDS[RiskLevel.HIGH].min);
    expect(RISK_THRESHOLDS[RiskLevel.HIGH].max + 1).toBe(RISK_THRESHOLDS[RiskLevel.CRITICAL].min);
  });
});
