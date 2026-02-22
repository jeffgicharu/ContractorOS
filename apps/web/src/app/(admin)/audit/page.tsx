'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { AuditEvent } from '@contractor-os/shared';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditDiffViewer } from '@/components/audit/audit-diff-viewer';

type AuditEventWithEmail = AuditEvent & { userEmail?: string };

interface Filters {
  entityType: string;
  userId: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEventWithEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<Filters>({
    entityType: '',
    userId: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: Record<string, string | number> = {
        page: meta.page,
        pageSize: meta.pageSize,
      };
      if (filters.entityType) query.entityType = filters.entityType;
      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.dateFrom) query.dateFrom = filters.dateFrom;
      if (filters.dateTo) query.dateTo = filters.dateTo;

      const { data, meta: responseMeta } = await api.get<AuditEventWithEmail[]>(
        '/audit-log',
        query,
      ) as {
        data: AuditEventWithEmail[];
        meta: { page: number; pageSize: number; total: number; totalPages: number };
      };
      setEvents(data);
      setMeta(responseMeta);
    } catch {
      setError('Failed to load audit log');
    } finally {
      setIsLoading(false);
    }
  }, [filters, meta.page, meta.pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFiltersChange(newFilters: Filters) {
    setFilters(newFilters);
    setMeta((prev) => ({ ...prev, page: 1 }));
  }

  function formatTimestamp(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-tight text-slate-900">
        Audit Log
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Track all state-changing operations across the system.
      </p>

      <div className="mt-6">
        <AuditFilters filters={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-400">No audit events found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-8 px-4 py-3" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                      Entity ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <>
                      <tr
                        key={event.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                        onClick={() =>
                          setExpandedId(expandedId === event.id ? null : event.id)
                        }
                      >
                        <td className="px-4 py-3 text-slate-400">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className={`transition-transform ${
                              expandedId === event.id ? 'rotate-90' : ''
                            }`}
                          >
                            <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-slate-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatTimestamp(event.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-slate-600">
                          {event.userEmail ?? event.userId ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {event.entityType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ActionBadge action={event.action} />
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-slate-400">
                          {event.entityId?.slice(0, 8) ?? '—'}
                        </td>
                      </tr>
                      {expandedId === event.id && (
                        <tr key={`${event.id}-diff`} className="border-b border-slate-100">
                          <td colSpan={6} className="bg-slate-50 px-8 py-4">
                            <AuditDiffViewer
                              oldValues={event.oldValues}
                              newValues={event.newValues}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Page {meta.page} of {meta.totalPages} ({meta.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    create: 'bg-green-50 text-green-700',
    update: 'bg-blue-50 text-blue-700',
    delete: 'bg-red-50 text-red-700',
    approve: 'bg-emerald-50 text-emerald-700',
    reject: 'bg-red-50 text-red-700',
    submit: 'bg-indigo-50 text-indigo-700',
    schedule: 'bg-amber-50 text-amber-700',
    'mark-paid': 'bg-emerald-50 text-emerald-700',
  };

  const color = colorMap[action] ?? 'bg-slate-100 text-slate-600';

  return (
    <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${color}`}>
      {action}
    </span>
  );
}
