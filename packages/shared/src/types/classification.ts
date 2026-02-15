import type { RiskLevel } from '../constants/state-machines';
import type { FactorCategory, FactorSource } from '../constants/classification-factors';

export interface ClassificationAssessment {
  id: string;
  contractorId: string;
  organizationId: string;
  assessedAt: string;
  overallRisk: RiskLevel;
  overallScore: number;
  irsScore: number;
  irsFactors: IrsFactorsResult;
  dolScore: number;
  dolFactors: DolFactorsResult;
  abcScore: number;
  abcFactors: AbcFactorsResult;
  inputData: ClassificationInputData;
  createdAt: string;
}

export interface IrsFactorGroupResult {
  score: number;
  max: number;
  factors: Record<string, { value: boolean | string; weight: number; score: number }>;
}

export interface IrsFactorsResult {
  behavioral_control: IrsFactorGroupResult;
  financial_control: IrsFactorGroupResult;
  relationship_type: IrsFactorGroupResult;
}

export interface DolFactorsResult {
  [factorKey: string]: { value: boolean | string | number; weight: number; score: number };
}

export interface AbcFactorsResult {
  prong_a: { passed: boolean; weight: number; score: number; notes?: string };
  prong_b: { passed: boolean; weight: number; score: number; notes?: string };
  prong_c: { passed: boolean; weight: number; score: number; notes?: string };
}

export interface ClassificationInputData {
  hoursPerWeek?: number;
  engagementDurationWeeks?: number;
  exclusivityRatio?: number;
  setSchedule?: boolean;
  toolsProvided?: boolean;
  trainingProvided?: boolean;
  supervisionLevel?: string;
  integrationLevel?: string;
  multipleClients?: boolean;
  profitLossOpportunity?: boolean;
  significantInvestment?: boolean;
}

export interface ClassificationFactor {
  id: string;
  contractorId: string;
  category: FactorCategory;
  numericValue: number | null;
  booleanValue: boolean | null;
  textValue: string | null;
  periodStart: string;
  periodEnd: string;
  source: FactorSource;
  createdAt: string;
}

export interface ClassificationDashboard {
  summary: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    total: number;
  };
  topRiskContractors: {
    contractorId: string;
    contractorName: string;
    overallRisk: RiskLevel;
    overallScore: number;
    assessedAt: string;
  }[];
}

export interface RiskSummaryView {
  contractorId: string;
  organizationId: string;
  contractorName: string;
  contractorStatus: string;
  overallRisk: RiskLevel | null;
  overallScore: number | null;
  irsScore: number | null;
  dolScore: number | null;
  abcScore: number | null;
  assessedAt: string | null;
  avgWeeklyHours: number;
  weeksActive: number;
  engagementCount: number;
}
