'use client';

import { formatDate } from '@/lib/format';
import type { InvoiceStatusHistoryEntry } from '@contractor-os/shared';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { InvoiceStatus } from '@contractor-os/shared';

interface InvoiceTimelineProps {
  history: InvoiceStatusHistoryEntry[];
}

export function InvoiceTimeline({ history }: InvoiceTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-slate-400">No status history yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, idx) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-brand-500 mt-1.5" />
            {idx < history.length - 1 && (
              <div className="w-px flex-1 bg-slate-200" />
            )}
          </div>
          <div className="pb-4">
            <div className="flex items-center gap-2">
              <InvoiceStatusBadge status={entry.toStatus as InvoiceStatus} />
              <span className="text-xs text-slate-400">
                {formatDate(entry.createdAt)}
              </span>
            </div>
            {entry.reason && (
              <p className="mt-1 text-[13px] text-slate-600">{entry.reason}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
