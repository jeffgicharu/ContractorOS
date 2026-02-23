'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { ClassificationAssessment } from '@contractor-os/shared';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { RiskScoreGauge } from './risk-score-gauge';
import { TestBreakdown } from './test-breakdown';
import { RiskTrendChart } from './risk-trend-chart';

interface RiskTabProps {
  contractorId: string;
}

export function RiskTab({ contractorId }: RiskTabProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [assessment, setAssessment] = useState<ClassificationAssessment | null>(null);
  const [history, setHistory] = useState<ClassificationAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        api.get<ClassificationAssessment>(`/contractors/${contractorId}/risk-assessment`).catch(() => null),
        api.get<ClassificationAssessment[]>(`/contractors/${contractorId}/risk-assessment/history`, { limit: 20 }),
      ]);
      if (latestRes) {
        setAssessment(latestRes.data);
      }
      setHistory(historyRes.data);
    } catch {
      setError('Failed to load risk assessment data');
    } finally {
      setIsLoading(false);
    }
  }, [contractorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunAssessment = async () => {
    setIsRunning(true);
    try {
      const { data } = await api.post<ClassificationAssessment>(
        `/contractors/${contractorId}/risk-assessment/run`,
      );
      setAssessment(data);
      setHistory((prev) => [data, ...prev]);
    } catch {
      setError('Failed to run assessment');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">{error}</p>
        {isAdmin && (
          <Button variant="primary" size="sm" className="mt-3" onClick={handleRunAssessment}>
            Run First Assessment
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with run button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Classification Risk Assessment</h3>
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAssessment}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Run Assessment'}
          </Button>
        )}
      </div>

      {assessment ? (
        <>
          {/* Gauge + summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-6 flex items-center justify-center">
              <RiskScoreGauge
                score={assessment.overallScore}
                riskLevel={assessment.overallRisk}
              />
            </div>
            <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-6">
              <h4 className="text-sm font-medium text-slate-900">Test Scores</h4>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <ScoreCard label="IRS Common-Law" score={assessment.irsScore} max={100} weight="40%" />
                <ScoreCard label="DOL Economic Realities" score={assessment.dolScore} max={100} weight="30%" />
                <ScoreCard label="California ABC" score={assessment.abcScore} max={100} weight="30%" />
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Assessed {new Date(assessment.assessedAt).toLocaleDateString()}
                {' · '}
                Weighted: IRS 40% + DOL 30% + ABC 30%
              </p>
            </div>
          </div>

          {/* Test breakdown */}
          <TestBreakdown
            irsScore={assessment.irsScore}
            irsFactors={assessment.irsFactors}
            dolScore={assessment.dolScore}
            dolFactors={assessment.dolFactors}
            abcScore={assessment.abcScore}
            abcFactors={assessment.abcFactors}
          />

          {/* Trend chart */}
          {history.length > 1 && <RiskTrendChart assessments={history} />}
        </>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No assessment has been run yet.</p>
          <Button variant="primary" size="sm" className="mt-3" onClick={handleRunAssessment}>
            Run First Assessment
          </Button>
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  score,
  max,
  weight,
}: {
  label: string;
  score: number;
  max: number;
  weight: string;
}) {
  const pct = (score / max) * 100;
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold font-mono text-slate-900">{score}</div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-brand-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="mt-0.5 text-[11px] text-slate-400">Weight: {weight}</div>
    </div>
  );
}
