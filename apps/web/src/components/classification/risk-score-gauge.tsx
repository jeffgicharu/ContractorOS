'use client';

import type { RiskLevel } from '@contractor-os/shared';

const GAUGE_COLORS: Record<string, { arc: string; bg: string; label: string }> = {
  low: { arc: '#22C55E', bg: '#F0FDF4', label: 'Low Risk' },
  medium: { arc: '#F59E0B', bg: '#FFFBEB', label: 'Medium Risk' },
  high: { arc: '#F97316', bg: '#FFF7ED', label: 'High Risk' },
  critical: { arc: '#EF4444', bg: '#FEF2F2', label: 'Critical Risk' },
};

interface RiskScoreGaugeProps {
  score: number;
  riskLevel: RiskLevel;
  size?: number;
}

export function RiskScoreGauge({ score, riskLevel, size = 180 }: RiskScoreGaugeProps) {
  const config = (GAUGE_COLORS[riskLevel] ?? GAUGE_COLORS['low'])!;
  const center = size / 2;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score, 100) / 100;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={config.arc}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease-in-out' }}
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-900"
          style={{ fontSize: '30px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
        >
          {score.toFixed(1)}
        </text>
        {/* Risk label */}
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '12px', fontWeight: 500, fill: config.arc }}
        >
          {config.label}
        </text>
      </svg>
    </div>
  );
}
