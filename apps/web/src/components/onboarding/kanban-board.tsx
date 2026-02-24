import { ContractorStatus, type ContractorListItem } from '@contractor-os/shared';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

const COLUMNS = [
  { status: ContractorStatus.INVITE_SENT, title: 'Invite Sent', color: '#3B82F6' },
  { status: ContractorStatus.TAX_FORM_PENDING, title: 'Tax Form Pending', color: '#F59E0B' },
  { status: ContractorStatus.CONTRACT_PENDING, title: 'Contract Pending', color: '#8B5CF6' },
  { status: ContractorStatus.BANK_DETAILS_PENDING, title: 'Bank Details', color: '#14B8A6' },
] as const;

interface KanbanBoardProps {
  contractors: ContractorListItem[];
  isLoading: boolean;
}

export function KanbanBoard({ contractors, isLoading }: KanbanBoardProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className="w-[260px] shrink-0 lg:w-auto lg:flex-1 rounded-lg border border-slate-200 bg-white"
            style={{ borderTopWidth: '3px', borderTopColor: col.color, borderTopStyle: 'solid' }}
          >
            <div className="border-b border-slate-200 px-3 py-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="space-y-2 p-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-md bg-slate-50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const grouped = new Map<string, ContractorListItem[]>();
  for (const col of COLUMNS) {
    grouped.set(col.status, []);
  }
  for (const contractor of contractors) {
    const list = grouped.get(contractor.status);
    if (list) list.push(contractor);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const items = grouped.get(col.status) ?? [];
        return (
          <KanbanColumn
            key={col.status}
            title={col.title}
            color={col.color}
            count={items.length}
          >
            {items.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No contractors
              </p>
            ) : (
              items.map((contractor) => (
                <KanbanCard key={contractor.id} contractor={contractor} />
              ))
            )}
          </KanbanColumn>
        );
      })}
    </div>
  );
}
