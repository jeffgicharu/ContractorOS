import type { ClassificationInputData, AbcFactorsResult } from '@contractor-os/shared';
import { ABC_FACTORS } from '@contractor-os/shared';

export interface AbcTestResult {
  score: number;
  factors: AbcFactorsResult;
}

/**
 * California ABC Test. All three prongs must be satisfied to classify as contractor.
 * Burden of proof on employer — undefined inputs default to failing (employee-like).
 */
export function scoreAbcTest(input: ClassificationInputData): AbcTestResult {
  // Prong A: Free from control and direction (weight 34)
  // Passed if: not on set schedule AND tools not provided AND supervision is not high
  const prongAPassed =
    input.setSchedule === false &&
    input.toolsProvided === false &&
    input.supervisionLevel !== 'high';
  const prongAScore = prongAPassed ? 0 : ABC_FACTORS.prong_a.weight;
  const prongANotes = prongAPassed
    ? 'Worker is free from control and direction'
    : buildProngANotes(input);

  // Prong B: Outside usual course of business (weight 33)
  // Passed if: integration level is low
  const prongBPassed = input.integrationLevel === 'low';
  const prongBScore = prongBPassed ? 0 : ABC_FACTORS.prong_b.weight;
  const prongBNotes = prongBPassed
    ? 'Work is outside usual course of business'
    : 'Work appears integral to business operations';

  // Prong C: Independently established trade or business (weight 33)
  // Passed if: has multiple clients AND has significant investment
  const prongCPassed =
    input.multipleClients === true && input.significantInvestment === true;
  const prongCScore = prongCPassed ? 0 : ABC_FACTORS.prong_c.weight;
  const prongCNotes = prongCPassed
    ? 'Worker has independently established trade'
    : buildProngCNotes(input);

  const totalScore = prongAScore + prongBScore + prongCScore;

  return {
    score: totalScore,
    factors: {
      prong_a: {
        passed: prongAPassed,
        weight: ABC_FACTORS.prong_a.weight,
        score: prongAScore,
        notes: prongANotes,
      },
      prong_b: {
        passed: prongBPassed,
        weight: ABC_FACTORS.prong_b.weight,
        score: prongBScore,
        notes: prongBNotes,
      },
      prong_c: {
        passed: prongCPassed,
        weight: ABC_FACTORS.prong_c.weight,
        score: prongCScore,
        notes: prongCNotes,
      },
    },
  };
}

function buildProngANotes(input: ClassificationInputData): string {
  const issues: string[] = [];
  if (input.setSchedule !== false) issues.push('set schedule');
  if (input.toolsProvided !== false) issues.push('tools provided');
  if (input.supervisionLevel === 'high') issues.push('high supervision');
  if (issues.length === 0) issues.push('insufficient data to demonstrate freedom from control');
  return `Control indicators: ${issues.join(', ')}`;
}

function buildProngCNotes(input: ClassificationInputData): string {
  const issues: string[] = [];
  if (input.multipleClients !== true) issues.push('no evidence of multiple clients');
  if (input.significantInvestment !== true) issues.push('no significant investment');
  if (issues.length === 0) issues.push('insufficient data');
  return `Independence issues: ${issues.join(', ')}`;
}
