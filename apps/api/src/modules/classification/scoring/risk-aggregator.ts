import type { RiskLevel } from '@contractor-os/shared';
import { RISK_THRESHOLDS } from '@contractor-os/shared';

export interface AggregatedRiskResult {
  overallScore: number;
  overallRisk: RiskLevel;
}

const IRS_WEIGHT = 0.4;
const DOL_WEIGHT = 0.3;
const ABC_WEIGHT = 0.3;

export function aggregateRiskScore(
  irsScore: number,
  dolScore: number,
  abcScore: number,
): AggregatedRiskResult {
  const raw = irsScore * IRS_WEIGHT + dolScore * DOL_WEIGHT + abcScore * ABC_WEIGHT;
  const overallScore = Math.round(raw * 100) / 100;
  const overallRisk = scoreToRiskLevel(overallScore);
  return { overallScore, overallRisk };
}

export function scoreToRiskLevel(score: number): RiskLevel {
  for (const [level, { min, max }] of Object.entries(RISK_THRESHOLDS)) {
    if (score >= min && score <= max) {
      return level as RiskLevel;
    }
  }
  // Fallback for edge cases (score > 100 or < 0)
  if (score > 100) return 'critical';
  return 'low';
}
