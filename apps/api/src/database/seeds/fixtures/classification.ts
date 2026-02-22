import { SEED_ORG_ID } from './organizations';

// John Smith: high risk (40hrs/week, tools provided, training, single engagement)
const JOHN_SMITH_ID = '33333333-3333-3333-3333-333333333301';
// Maria Garcia: low risk (20hrs/week, own tools, multiple clients)
const MARIA_GARCIA_ID = '33333333-3333-3333-3333-333333333302';

export const ASSESSMENT_JOHN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001';
export const ASSESSMENT_MARIA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002';

export const classificationAssessments = [
  {
    id: ASSESSMENT_JOHN_ID,
    contractorId: JOHN_SMITH_ID,
    organizationId: SEED_ORG_ID,
    overallRisk: 'high',
    overallScore: 66.5,
    irsScore: 70,
    irsFactors: {
      behavioral_control: {
        score: 30,
        max: 40,
        factors: {
          instructions_given: { value: true, weight: 10, score: 10 },
          training_provided: { value: true, weight: 10, score: 10 },
          set_work_hours: { value: true, weight: 10, score: 10 },
          tools_provided: { value: false, weight: 10, score: 0 },
        },
      },
      financial_control: {
        score: 20,
        max: 30,
        factors: {
          significant_investment: { value: false, weight: 10, score: 10 },
          unreimbursed_expenses: { value: false, weight: 10, score: 0 },
          opportunity_profit_loss: { value: false, weight: 10, score: 10 },
        },
      },
      relationship_type: {
        score: 20,
        max: 30,
        factors: {
          written_contract_type: { value: 'contractor', weight: 10, score: 0 },
          benefits_provided: { value: false, weight: 10, score: 0 },
          permanency: { value: 'ongoing', weight: 10, score: 10 },
        },
      },
    },
    dolScore: 65,
    dolFactors: {
      opportunity_profit_loss: { value: false, weight: 17, score: 17 },
      investment: { value: false, weight: 17, score: 17 },
      permanence: { value: 60, weight: 17, score: 17 },
      employer_control: { value: true, weight: 17, score: 11 },
      integral_to_business: { value: 'medium', weight: 16, score: 8 },
      skill_initiative: { value: true, weight: 16, score: 16 },
    },
    abcScore: 67,
    abcFactors: {
      prong_a: { passed: false, weight: 34, score: 34, notes: 'Control indicators: set schedule' },
      prong_b: { passed: true, weight: 33, score: 0, notes: 'Work is outside usual course of business' },
      prong_c: { passed: false, weight: 33, score: 33, notes: 'Independence issues: no evidence of multiple clients, no significant investment' },
    },
    inputData: {
      hoursPerWeek: 40,
      engagementDurationWeeks: 60,
      setSchedule: true,
      toolsProvided: false,
      trainingProvided: true,
      supervisionLevel: 'medium',
      integrationLevel: 'medium',
      multipleClients: false,
      profitLossOpportunity: false,
      significantInvestment: false,
    },
  },
  {
    id: ASSESSMENT_MARIA_ID,
    contractorId: MARIA_GARCIA_ID,
    organizationId: SEED_ORG_ID,
    overallRisk: 'low',
    overallScore: 18.4,
    irsScore: 14,
    irsFactors: {
      behavioral_control: {
        score: 0,
        max: 40,
        factors: {
          instructions_given: { value: false, weight: 10, score: 0 },
          training_provided: { value: false, weight: 10, score: 0 },
          set_work_hours: { value: false, weight: 10, score: 0 },
          tools_provided: { value: false, weight: 10, score: 0 },
        },
      },
      financial_control: {
        score: 0,
        max: 30,
        factors: {
          significant_investment: { value: true, weight: 10, score: 0 },
          unreimbursed_expenses: { value: false, weight: 10, score: 0 },
          opportunity_profit_loss: { value: true, weight: 10, score: 0 },
        },
      },
      relationship_type: {
        score: 14,
        max: 30,
        factors: {
          written_contract_type: { value: 'contractor', weight: 10, score: 0 },
          benefits_provided: { value: false, weight: 10, score: 0 },
          permanency: { value: 'long_term', weight: 10, score: 7 },
        },
      },
    },
    dolScore: 23,
    dolFactors: {
      opportunity_profit_loss: { value: true, weight: 17, score: 0 },
      investment: { value: true, weight: 17, score: 0 },
      permanence: { value: 30, weight: 17, score: 12 },
      employer_control: { value: false, weight: 17, score: 0 },
      integral_to_business: { value: 'low', weight: 16, score: 0 },
      skill_initiative: { value: false, weight: 16, score: 0 },
    },
    abcScore: 0,
    abcFactors: {
      prong_a: { passed: true, weight: 34, score: 0, notes: 'Worker is free from control and direction' },
      prong_b: { passed: true, weight: 33, score: 0, notes: 'Work is outside usual course of business' },
      prong_c: { passed: true, weight: 33, score: 0, notes: 'Worker has independently established trade' },
    },
    inputData: {
      hoursPerWeek: 20,
      engagementDurationWeeks: 30,
      setSchedule: false,
      toolsProvided: false,
      trainingProvided: false,
      supervisionLevel: 'low',
      integrationLevel: 'low',
      multipleClients: true,
      profitLossOpportunity: true,
      significantInvestment: true,
    },
  },
];

export const classificationFactors = [
  // John Smith manual factors
  {
    contractorId: JOHN_SMITH_ID,
    category: 'set_schedule',
    booleanValue: true,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
  },
  {
    contractorId: JOHN_SMITH_ID,
    category: 'training_provided',
    booleanValue: true,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
  },
  {
    contractorId: JOHN_SMITH_ID,
    category: 'significant_investment',
    booleanValue: false,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
  },
  {
    contractorId: JOHN_SMITH_ID,
    category: 'profit_loss_opportunity',
    booleanValue: false,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
  },
  // Maria Garcia manual factors
  {
    contractorId: MARIA_GARCIA_ID,
    category: 'multiple_clients',
    booleanValue: true,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
  },
  {
    contractorId: MARIA_GARCIA_ID,
    category: 'significant_investment',
    booleanValue: true,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
  },
  {
    contractorId: MARIA_GARCIA_ID,
    category: 'profit_loss_opportunity',
    booleanValue: true,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
  },
  {
    contractorId: MARIA_GARCIA_ID,
    category: 'integration_level',
    textValue: 'low',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    source: 'manual',
  },
];
