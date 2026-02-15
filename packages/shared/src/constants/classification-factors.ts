export const FactorCategory = {
  HOURS_PER_WEEK: 'hours_per_week',
  ENGAGEMENT_DURATION_WEEKS: 'engagement_duration_weeks',
  EXCLUSIVITY_RATIO: 'exclusivity_ratio',
  SET_SCHEDULE: 'set_schedule',
  TOOLS_PROVIDED: 'tools_provided',
  TRAINING_PROVIDED: 'training_provided',
  SUPERVISION_LEVEL: 'supervision_level',
  INTEGRATION_LEVEL: 'integration_level',
  MULTIPLE_CLIENTS: 'multiple_clients',
  PROFIT_LOSS_OPPORTUNITY: 'profit_loss_opportunity',
  SIGNIFICANT_INVESTMENT: 'significant_investment',
} as const;

export type FactorCategory = (typeof FactorCategory)[keyof typeof FactorCategory];

export const FactorSource = {
  COMPUTED: 'computed',
  MANUAL: 'manual',
  TIME_ENTRY: 'time_entry',
} as const;

export type FactorSource = (typeof FactorSource)[keyof typeof FactorSource];

export const LegalTest = {
  IRS: 'irs',
  DOL: 'dol',
  ABC: 'abc',
} as const;

export type LegalTest = (typeof LegalTest)[keyof typeof LegalTest];

// IRS Common-Law Test factor groups and their weights
export const IRS_FACTORS = {
  behavioral_control: {
    label: 'Behavioral Control',
    maxScore: 40,
    factors: {
      instructions_given: { label: 'Instructions Given', weight: 10 },
      training_provided: { label: 'Training Provided', weight: 10 },
      set_work_hours: { label: 'Set Work Hours', weight: 10 },
      tools_provided: { label: 'Tools Provided', weight: 10 },
    },
  },
  financial_control: {
    label: 'Financial Control',
    maxScore: 30,
    factors: {
      significant_investment: { label: 'Significant Investment', weight: 10 },
      unreimbursed_expenses: { label: 'Unreimbursed Expenses', weight: 10 },
      opportunity_profit_loss: { label: 'Opportunity for Profit/Loss', weight: 10 },
    },
  },
  relationship_type: {
    label: 'Relationship Type',
    maxScore: 30,
    factors: {
      written_contract_type: { label: 'Written Contract Type', weight: 10 },
      benefits_provided: { label: 'Benefits Provided', weight: 10 },
      permanency: { label: 'Permanency of Relationship', weight: 10 },
    },
  },
} as const;

// DOL Economic Realities Test factors
export const DOL_FACTORS = {
  opportunity_profit_loss: { label: 'Opportunity for Profit or Loss', weight: 17 },
  investment: { label: "Worker's Investment", weight: 17 },
  permanence: { label: 'Permanence of Relationship', weight: 17 },
  employer_control: { label: 'Nature and Degree of Control', weight: 17 },
  integral_to_business: { label: 'Integral to Business', weight: 16 },
  skill_initiative: { label: 'Skill and Initiative', weight: 16 },
} as const;

// California ABC Test prongs
export const ABC_FACTORS = {
  prong_a: {
    label: 'Free from Control',
    description: 'Worker is free from the control and direction of the hiring entity',
    weight: 34,
  },
  prong_b: {
    label: 'Outside Usual Course',
    description: "Work performed is outside the usual course of the hiring entity's business",
    weight: 33,
  },
  prong_c: {
    label: 'Independently Established',
    description:
      'Worker is customarily engaged in an independently established trade or business',
    weight: 33,
  },
} as const;
