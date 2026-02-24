'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TimeEntry, PaginationMeta } from '@contractor-os/shared';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { TimeEntryForm } from '@/components/time-entries/time-entry-form';

export default function PortalTimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: Record<string, string | number | boolean | undefined> = {
        page,
        pageSize: 20,
      };
      if (dateFrom) query.dateFrom = dateFrom;
      if (dateTo) query.dateTo = dateTo;

      const response = await api.get<TimeEntry[]>('/time-entries', query);
      setEntries(response.data);
      setMeta((response as { meta?: PaginationMeta }).meta ?? null);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [page, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  async function handleDelete(id: string) {
    try {
      await api.delete(`/time-entries/${id}`);
      load();
    } catch {
      // silent
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Time Entries
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Log and manage your work hours
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>Log Time</Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="dateFrom" className="text-sm text-slate-600">From</label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-8 px-2 text-sm border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dateTo" className="text-sm text-slate-600">To</label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-8 px-2 text-sm border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-slate-500">
          {totalHours.toFixed(1)} hours this page
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No time entries yet. Click "Log Time" to get started.</p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200">
                  Date
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200">
                  Hours
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200 hidden sm:table-cell">
                  Description
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-slate-900 border-b border-slate-50">
                    {formatDate(entry.entryDate)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-right font-mono text-slate-900 border-b border-slate-50" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {entry.hours.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-50 hidden sm:table-cell">
                    {entry.description}
                  </td>
                  <td className="px-4 py-3 text-right border-b border-slate-50">
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-error-600 hover:text-error-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
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
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <TimeEntryForm
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
