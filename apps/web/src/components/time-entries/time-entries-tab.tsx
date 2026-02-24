'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TimeEntry, PaginationMeta } from '@contractor-os/shared';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';

interface TimeEntriesTabProps {
  contractorId: string;
}

export function TimeEntriesTab({ contractorId }: TimeEntriesTabProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<TimeEntry[]>('/time-entries', {
        contractorId,
        page,
        pageSize: 20,
      });
      setEntries(response.data);
      setMeta((response as { meta?: PaginationMeta }).meta ?? null);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [contractorId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          Time Entries
        </h3>
        <span className="text-sm text-slate-500">
          {totalHours.toFixed(1)} hours this page
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">No time entries yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  Date
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  Hours
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-slate-900 border-b border-slate-100">
                    {formatDate(entry.entryDate)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-right font-mono text-slate-900 border-b border-slate-100" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {entry.hours.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100">
                    {entry.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages} ({meta.total} entries)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
