import Link from 'next/link';
import type { ContractorListItem } from '@contractor-os/shared';

interface KanbanCardProps {
  contractor: ContractorListItem;
}

function daysInStage(createdAt: string): number {
  return Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function KanbanCard({ contractor }: KanbanCardProps) {
  const days = daysInStage(contractor.createdAt);

  return (
    <Link href={`/contractors/${contractor.id}`}>
      <div className="rounded-md border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-[#FAFBFE]">
        <p className="text-sm font-medium text-slate-900">
          {contractor.firstName} {contractor.lastName}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 truncate">
          {contractor.email}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          {days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`} in stage
        </p>
      </div>
    </Link>
  );
}
