'use client';

import Link from 'next/link';
import type { RiskLevel } from '@contractor-os/shared';
import { RiskLevelBadge } from '@/components/contractors/risk-level-badge';

interface RiskSummaryCardProps {
  contractorId: string;
  contractorName: string;
  overallRisk: RiskLevel;
  overallScore: number;
  assessedAt: string;
}

export function RiskSummaryCard({
  contractorId,
  contractorName,
  overallRisk,
  overallScore,
  assessedAt,
}: RiskSummaryCardProps) {
  const date = new Date(assessedAt);
  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

  return (
    <Link
      href={`/contractors/${contractorId}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-slate-900">{contractorName}</h4>
          <p className="mt-1 text-xs text-slate-400">Assessed {formattedDate}</p>
        </div>
        <RiskLevelBadge level={overallRisk} score={overallScore} />
      </div>
    </Link>
  );
}
