import type { ClassificationInputData, IrsFactorsResult } from '@contractor-os/shared';
import { IRS_FACTORS } from '@contractor-os/shared';

export interface IrsTestResult {
  score: number;
  factors: IrsFactorsResult;
}

export function scoreIrsTest(input: ClassificationInputData): IrsTestResult {
  // Behavioral Control (max 40)
  const instructionsGiven = input.trainingProvided === true || input.supervisionLevel === 'high';
  const trainingProvided = input.trainingProvided === true;
  const setWorkHours =
    (input.hoursPerWeek !== undefined && input.hoursPerWeek > 35) ||
    input.setSchedule === true;
  const toolsProvided = input.toolsProvided === true;

  const behavioralFactors = {
    instructions_given: {
      value: instructionsGiven,
      weight: IRS_FACTORS.behavioral_control.factors.instructions_given.weight,
      score: instructionsGiven ? IRS_FACTORS.behavioral_control.factors.instructions_given.weight : 0,
    },
    training_provided: {
      value: trainingProvided,
      weight: IRS_FACTORS.behavioral_control.factors.training_provided.weight,
      score: trainingProvided ? IRS_FACTORS.behavioral_control.factors.training_provided.weight : 0,
    },
    set_work_hours: {
      value: setWorkHours,
      weight: IRS_FACTORS.behavioral_control.factors.set_work_hours.weight,
      score: setWorkHours ? IRS_FACTORS.behavioral_control.factors.set_work_hours.weight : 0,
    },
    tools_provided: {
      value: toolsProvided,
      weight: IRS_FACTORS.behavioral_control.factors.tools_provided.weight,
      score: toolsProvided ? IRS_FACTORS.behavioral_control.factors.tools_provided.weight : 0,
    },
  };

  const behavioralScore =
    behavioralFactors.instructions_given.score +
    behavioralFactors.training_provided.score +
    behavioralFactors.set_work_hours.score +
    behavioralFactors.tools_provided.score;

  // Financial Control (max 30) — inverted: lack of investment/opportunity = employee-like
  const noSignificantInvestment = input.significantInvestment === false;
  const noProfitLossOpportunity = input.profitLossOpportunity === false;
  // Unreimbursed expenses: if tools are provided, worker likely doesn't have unreimbursed expenses
  const noUnreimbursedExpenses = input.toolsProvided === true;

  const financialFactors = {
    significant_investment: {
      value: noSignificantInvestment,
      weight: IRS_FACTORS.financial_control.factors.significant_investment.weight,
      score: noSignificantInvestment ? IRS_FACTORS.financial_control.factors.significant_investment.weight : 0,
    },
    unreimbursed_expenses: {
      value: noUnreimbursedExpenses,
      weight: IRS_FACTORS.financial_control.factors.unreimbursed_expenses.weight,
      score: noUnreimbursedExpenses ? IRS_FACTORS.financial_control.factors.unreimbursed_expenses.weight : 0,
    },
    opportunity_profit_loss: {
      value: noProfitLossOpportunity,
      weight: IRS_FACTORS.financial_control.factors.opportunity_profit_loss.weight,
      score: noProfitLossOpportunity ? IRS_FACTORS.financial_control.factors.opportunity_profit_loss.weight : 0,
    },
  };

  const financialScore =
    financialFactors.significant_investment.score +
    financialFactors.unreimbursed_expenses.score +
    financialFactors.opportunity_profit_loss.score;

  // Relationship Type (max 30)
  // Written contract type: if no contract exists or it says "employee", score full weight
  const contractType = input.integrationLevel === 'high' ? 'employee' : 'contractor';
  const contractIsEmployee = contractType === 'employee';

  // Benefits provided: derived from integration level
  const benefitsProvided = input.integrationLevel === 'high';

  // Permanency: based on engagement duration
  let permanencyScore = 0;
  const durationWeeks = input.engagementDurationWeeks;
  if (durationWeeks !== undefined) {
    if (durationWeeks > 52) permanencyScore = 10;
    else if (durationWeeks > 26) permanencyScore = 7;
    else if (durationWeeks > 12) permanencyScore = 4;
    else permanencyScore = 0;
  }

  const permanencyValue =
    durationWeeks !== undefined
      ? durationWeeks > 52
        ? 'ongoing'
        : durationWeeks > 26
          ? 'long_term'
          : durationWeeks > 12
            ? 'medium_term'
            : 'short_term'
      : 'unknown';

  const relationshipFactors = {
    written_contract_type: {
      value: contractType as boolean | string,
      weight: IRS_FACTORS.relationship_type.factors.written_contract_type.weight,
      score: contractIsEmployee ? IRS_FACTORS.relationship_type.factors.written_contract_type.weight : 0,
    },
    benefits_provided: {
      value: benefitsProvided,
      weight: IRS_FACTORS.relationship_type.factors.benefits_provided.weight,
      score: benefitsProvided ? IRS_FACTORS.relationship_type.factors.benefits_provided.weight : 0,
    },
    permanency: {
      value: permanencyValue as boolean | string,
      weight: IRS_FACTORS.relationship_type.factors.permanency.weight,
      score: permanencyScore,
    },
  };

  const relationshipScore =
    relationshipFactors.written_contract_type.score +
    relationshipFactors.benefits_provided.score +
    relationshipFactors.permanency.score;

  const totalScore = behavioralScore + financialScore + relationshipScore;

  return {
    score: totalScore,
    factors: {
      behavioral_control: {
        score: behavioralScore,
        max: IRS_FACTORS.behavioral_control.maxScore,
        factors: behavioralFactors,
      },
      financial_control: {
        score: financialScore,
        max: IRS_FACTORS.financial_control.maxScore,
        factors: financialFactors,
      },
      relationship_type: {
        score: relationshipScore,
        max: IRS_FACTORS.relationship_type.maxScore,
        factors: relationshipFactors,
      },
    },
  };
}
