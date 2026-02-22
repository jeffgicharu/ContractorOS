'use client';

import { useState } from 'react';
import type { IrsFactorsResult, DolFactorsResult, AbcFactorsResult } from '@contractor-os/shared';

interface TestBreakdownProps {
  irsScore: number;
  irsFactors: IrsFactorsResult;
  dolScore: number;
  dolFactors: DolFactorsResult;
  abcScore: number;
  abcFactors: AbcFactorsResult;
}

export function TestBreakdown({
  irsScore,
  irsFactors,
  dolScore,
  dolFactors,
  abcScore,
  abcFactors,
}: TestBreakdownProps) {
  return (
    <div className="space-y-3">
      <IrsSection score={irsScore} factors={irsFactors} />
      <DolSection score={dolScore} factors={dolFactors} />
      <AbcSection score={abcScore} factors={abcFactors} />
    </div>
  );
}

function CollapsibleSection({
  title,
  score,
  maxScore,
  children,
}: {
  title: string;
  score: number;
  maxScore: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-900">{title}</span>
          <span className="text-xs font-mono text-slate-500">
            {score}/{maxScore}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-20 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-brand-500"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-3">{children}</div>}
    </div>
  );
}

function FactorRow({
  label,
  value,
  score,
  weight,
}: {
  label: string;
  value: boolean | string | number;
  score: number;
  weight: number;
}) {
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  const isRisky = score > 0;

  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className={isRisky ? 'text-risk-high-text font-medium' : 'text-slate-500'}>
          {display}
        </span>
        <span className="w-12 text-right font-mono text-xs text-slate-400">
          {score}/{weight}
        </span>
      </div>
    </div>
  );
}

function IrsSection({ score, factors }: { score: number; factors: IrsFactorsResult }) {
  const irsLabels: Record<string, string> = {
    instructions_given: 'Instructions Given',
    training_provided: 'Training Provided',
    set_work_hours: 'Set Work Hours',
    tools_provided: 'Tools Provided',
    significant_investment: 'No Significant Investment',
    unreimbursed_expenses: 'No Unreimbursed Expenses',
    opportunity_profit_loss: 'No Profit/Loss Opportunity',
    written_contract_type: 'Contract Type',
    benefits_provided: 'Benefits Provided',
    permanency: 'Permanency',
  };

  return (
    <CollapsibleSection title="IRS Common-Law Test" score={score} maxScore={100}>
      {(
        ['behavioral_control', 'financial_control', 'relationship_type'] as const
      ).map((group) => (
        <div key={group} className="mb-3 last:mb-0">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.replace(/_/g, ' ')} ({factors[group].score}/{factors[group].max})
          </div>
          {Object.entries(factors[group].factors).map(([key, f]) => (
            <FactorRow
              key={key}
              label={irsLabels[key] ?? key}
              value={f.value}
              score={f.score}
              weight={f.weight}
            />
          ))}
        </div>
      ))}
    </CollapsibleSection>
  );
}

function DolSection({ score, factors }: { score: number; factors: DolFactorsResult }) {
  const dolLabels: Record<string, string> = {
    opportunity_profit_loss: 'Opportunity for Profit/Loss',
    investment: "Worker's Investment",
    permanence: 'Permanence of Relationship',
    employer_control: 'Nature and Degree of Control',
    integral_to_business: 'Integral to Business',
    skill_initiative: 'Skill and Initiative',
  };

  return (
    <CollapsibleSection title="DOL Economic Realities Test" score={score} maxScore={100}>
      {Object.entries(factors).map(([key, f]) => (
        <FactorRow
          key={key}
          label={dolLabels[key] ?? key}
          value={f.value}
          score={f.score}
          weight={f.weight}
        />
      ))}
    </CollapsibleSection>
  );
}

function AbcSection({ score, factors }: { score: number; factors: AbcFactorsResult }) {
  return (
    <CollapsibleSection title="California ABC Test" score={score} maxScore={100}>
      {(['prong_a', 'prong_b', 'prong_c'] as const).map((key) => {
        const prong = factors[key];
        return (
          <div key={key} className="py-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-600">
                {key === 'prong_a'
                  ? 'A: Free from Control'
                  : key === 'prong_b'
                    ? 'B: Outside Usual Course'
                    : 'C: Independently Established'}
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium ${prong.passed ? 'text-risk-low-text' : 'text-risk-high-text'}`}
                >
                  {prong.passed ? 'Passed' : 'Failed'}
                </span>
                <span className="w-12 text-right font-mono text-xs text-slate-400">
                  {prong.score}/{prong.weight}
                </span>
              </div>
            </div>
            {prong.notes && (
              <p className="mt-0.5 text-xs text-slate-400">{prong.notes}</p>
            )}
          </div>
        );
      })}
    </CollapsibleSection>
  );
}
