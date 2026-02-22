'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { ClassificationDashboard } from '@contractor-os/shared';
import { RiskSummaryCard } from '@/components/classification/risk-summary-card';

const RISK_COLORS: Record<string, { bg: string; bar: string; label: string }> = {
  low: { bg: 'bg-risk-low-bg', bar: 'bg-risk-low', label: 'Low' },
  medium: { bg: 'bg-risk-medium-bg', bar: 'bg-risk-medium', label: 'Medium' },
  high: { bg: 'bg-risk-high-bg', bar: 'bg-risk-high', label: 'High' },
  critical: { bg: 'bg-risk-critical-bg', bar: 'bg-risk-critical', label: 'Critical' },
};

export default function ClassificationPage() {
  const [dashboard, setDashboard] = useState<ClassificationDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<ClassificationDashboard>('/classification/dashboard');
        setDashboard(data);
      } catch {
        setError('Failed to load classification dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-500">{error || 'Failed to load dashboard'}</p>
      </div>
    );
  }

  const { summary, topRiskContractors } = dashboard;

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-tight text-slate-900">
        Classification Risk Monitor
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        IRS, DOL, and California ABC test risk assessments across all active contractors.
      </p>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
          const config = RISK_COLORS[level]!;
          const count = summary[level];
          return (
            <div
              key={level}
              className={`rounded-lg border border-slate-200 ${config.bg} p-5`}
            >
              <div className="text-xs font-medium uppercase tracking-[0.05em] text-slate-500">
                {config.label} Risk
              </div>
              <div className="mt-1 text-[28px] font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk distribution bar */}
      {summary.total > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-900">Risk Distribution</h2>
          <div className="mt-3 flex h-8 overflow-hidden rounded-md">
            {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
              const count = summary[level];
              if (count === 0) return null;
              const pct = (count / summary.total) * 100;
              const config = RISK_COLORS[level]!;
              return (
                <div
                  key={level}
                  className={`${config.bar} flex items-center justify-center text-xs font-medium text-white`}
                  style={{ width: `${pct}%`, minWidth: count > 0 ? '32px' : '0' }}
                  title={`${config.label}: ${count} (${pct.toFixed(0)}%)`}
                >
                  {pct > 10 && count}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-4">
            {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
              const config = RISK_COLORS[level]!;
              return (
                <div key={level} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`h-2.5 w-2.5 rounded-sm ${config.bar}`} />
                  {config.label} ({summary[level]})
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top risk contractors */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-900">Top Risk Contractors</h2>
        {topRiskContractors.length === 0 ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-400">No contractors have been assessed yet.</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {topRiskContractors.map((c) => (
              <RiskSummaryCard
                key={c.contractorId}
                contractorId={c.contractorId}
                contractorName={c.contractorName}
                overallRisk={c.overallRisk}
                overallScore={c.overallScore}
                assessedAt={c.assessedAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
