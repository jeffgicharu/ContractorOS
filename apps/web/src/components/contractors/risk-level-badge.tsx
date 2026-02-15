import { RiskLevel } from '@contractor-os/shared';

const RISK_CONFIG: Record<
  RiskLevel,
  { dot: string; bg: string; border: string; text: string; label: string }
> = {
  [RiskLevel.LOW]: {
    dot: 'bg-risk-low',
    bg: 'bg-risk-low-bg',
    border: 'border-risk-low-border',
    text: 'text-risk-low-text',
    label: 'Low',
  },
  [RiskLevel.MEDIUM]: {
    dot: 'bg-risk-medium',
    bg: 'bg-risk-medium-bg',
    border: 'border-risk-medium-border',
    text: 'text-risk-medium-text',
    label: 'Medium',
  },
  [RiskLevel.HIGH]: {
    dot: 'bg-risk-high',
    bg: 'bg-risk-high-bg',
    border: 'border-risk-high-border',
    text: 'text-risk-high-text',
    label: 'High',
  },
  [RiskLevel.CRITICAL]: {
    dot: 'bg-risk-critical',
    bg: 'bg-risk-critical-bg',
    border: 'border-risk-critical-border',
    text: 'text-risk-critical-text',
    label: 'Critical',
  },
};

interface RiskLevelBadgeProps {
  level: RiskLevel;
  score?: number;
}

export function RiskLevelBadge({ level, score }: RiskLevelBadgeProps) {
  const config = RISK_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-sm border ${config.bg} ${config.border} ${config.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
      {score !== undefined && (
        <span className="font-mono text-[11px] opacity-75">({score})</span>
      )}
    </span>
  );
}
