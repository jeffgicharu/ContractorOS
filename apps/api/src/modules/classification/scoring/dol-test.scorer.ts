import type { ClassificationInputData, DolFactorsResult } from '@contractor-os/shared';
import { DOL_FACTORS } from '@contractor-os/shared';

export interface DolTestResult {
  score: number;
  factors: DolFactorsResult;
}

export function scoreDolTest(input: ClassificationInputData): DolTestResult {
  // Opportunity for Profit or Loss (weight 17)
  // No opportunity = employee-like
  const noProfitLoss = input.profitLossOpportunity === false;
  const profitLossScore = noProfitLoss ? DOL_FACTORS.opportunity_profit_loss.weight : 0;

  // Worker's Investment (weight 17)
  // No significant investment = employee-like
  const noInvestment = input.significantInvestment === false;
  const investmentScore = noInvestment ? DOL_FACTORS.investment.weight : 0;

  // Permanence of Relationship (weight 17)
  // Longer = more employee-like
  let permanenceScore = 0;
  const durationWeeks = input.engagementDurationWeeks;
  if (durationWeeks !== undefined) {
    if (durationWeeks > 52) permanenceScore = 17;
    else if (durationWeeks > 26) permanenceScore = 12;
    else if (durationWeeks > 12) permanenceScore = 6;
    else permanenceScore = 0;
  }

  // Nature and Degree of Control (weight 17)
  // Composite: setSchedule + toolsProvided + supervisionLevel
  const controlFactors = [
    input.setSchedule === true,
    input.toolsProvided === true,
    input.supervisionLevel === 'high',
  ];
  const controlTrueCount = controlFactors.filter(Boolean).length;
  const controlScore = Math.round((controlTrueCount / 3) * DOL_FACTORS.employer_control.weight);

  // Integral to Business (weight 16)
  // High integration = employee-like
  let integralScore = 0;
  if (input.integrationLevel === 'high') integralScore = 16;
  else if (input.integrationLevel === 'medium') integralScore = 8;
  else integralScore = 0;

  // Skill and Initiative (weight 16)
  // Composite: lack of multiple clients + no significant investment = less independent
  const skillFactors = [
    input.multipleClients === false,
    input.significantInvestment === false,
  ];
  const skillTrueCount = skillFactors.filter(Boolean).length;
  const skillScore = Math.round((skillTrueCount / 2) * DOL_FACTORS.skill_initiative.weight);

  const totalScore =
    profitLossScore + investmentScore + permanenceScore + controlScore + integralScore + skillScore;

  return {
    score: totalScore,
    factors: {
      opportunity_profit_loss: {
        value: noProfitLoss,
        weight: DOL_FACTORS.opportunity_profit_loss.weight,
        score: profitLossScore,
      },
      investment: {
        value: noInvestment,
        weight: DOL_FACTORS.investment.weight,
        score: investmentScore,
      },
      permanence: {
        value: durationWeeks ?? 0,
        weight: DOL_FACTORS.permanence.weight,
        score: permanenceScore,
      },
      employer_control: {
        value: controlTrueCount > 0,
        weight: DOL_FACTORS.employer_control.weight,
        score: controlScore,
      },
      integral_to_business: {
        value: input.integrationLevel ?? 'unknown',
        weight: DOL_FACTORS.integral_to_business.weight,
        score: integralScore,
      },
      skill_initiative: {
        value: skillTrueCount > 0,
        weight: DOL_FACTORS.skill_initiative.weight,
        score: skillScore,
      },
    },
  };
}
