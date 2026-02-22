'use client';

import type { ClassificationAssessment } from '@contractor-os/shared';

interface RiskTrendChartProps {
  assessments: ClassificationAssessment[];
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

const THRESHOLDS = [
  { value: 25, color: '#F59E0B', label: 'Medium' },
  { value: 50, color: '#F97316', label: 'High' },
  { value: 75, color: '#EF4444', label: 'Critical' },
];

export function RiskTrendChart({ assessments }: RiskTrendChartProps) {
  if (assessments.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-slate-200 bg-white">
        <p className="text-sm text-slate-400">No assessment history available</p>
      </div>
    );
  }

  const sorted = [...assessments].sort(
    (a, b) => new Date(a.assessedAt).getTime() - new Date(b.assessedAt).getTime(),
  );

  const plotW = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const xScale = (i: number) =>
    PADDING.left + (sorted.length === 1 ? plotW / 2 : (i / (sorted.length - 1)) * plotW);
  const yScale = (score: number) => PADDING.top + plotH - (score / 100) * plotH;

  const points = sorted.map((a, i) => `${xScale(i)},${yScale(a.overallScore)}`).join(' ');

  // Area fill path
  const areaPath =
    sorted.length > 1
      ? `M ${xScale(0)},${yScale(sorted[0]!.overallScore)} ` +
        sorted.map((a, i) => `L ${xScale(i)},${yScale(a.overallScore)}`).join(' ') +
        ` L ${xScale(sorted.length - 1)},${PADDING.top + plotH} L ${xScale(0)},${PADDING.top + plotH} Z`
      : '';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-medium text-slate-900">Risk Score Trend</h4>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        style={{ maxHeight: '200px' }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <line
            key={v}
            x1={PADDING.left}
            y1={yScale(v)}
            x2={CHART_WIDTH - PADDING.right}
            y2={yScale(v)}
            stroke="#F1F5F9"
            strokeWidth={1}
          />
        ))}

        {/* Threshold lines */}
        {THRESHOLDS.map((t) => (
          <line
            key={t.value}
            x1={PADDING.left}
            y1={yScale(t.value)}
            x2={CHART_WIDTH - PADDING.right}
            y2={yScale(t.value)}
            stroke={t.color}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.5}
          />
        ))}

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((v) => (
          <text
            key={v}
            x={PADDING.left - 8}
            y={yScale(v)}
            textAnchor="end"
            dominantBaseline="middle"
            style={{ fontSize: '11px', fill: '#94A3B8' }}
          >
            {v}
          </text>
        ))}

        {/* X-axis labels */}
        {sorted.map((a, i) => {
          // Only show label for first, last, and every ~3rd item
          if (sorted.length > 5 && i !== 0 && i !== sorted.length - 1 && i % 3 !== 0)
            return null;
          const date = new Date(a.assessedAt);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <text
              key={a.id}
              x={xScale(i)}
              y={CHART_HEIGHT - 5}
              textAnchor="middle"
              style={{ fontSize: '11px', fill: '#94A3B8' }}
            >
              {label}
            </text>
          );
        })}

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#areaGradient)"
          />
        )}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#6366F1"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {sorted.map((a, i) => (
          <circle
            key={a.id}
            cx={xScale(i)}
            cy={yScale(a.overallScore)}
            r={4}
            fill="#6366F1"
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.08)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
