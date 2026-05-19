'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import { DocumentStatusBadge } from '@/components/documents/document-status-badge';
import {
  MobileCard,
  MobileCardList,
  MobileCardRow,
} from '@/components/ui/responsive-table';
import type { ReadinessEntry1099 } from '@contractor-os/shared';

function ReadyBadge({ entry }: { entry: ReadinessEntry1099 }) {
  if (entry.isReady) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md bg-success-50 text-success-700">
        Ready
      </span>
    );
  }
  if (entry.requires1099) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md bg-error-50 text-error-700">
        Not Ready
      </span>
    );
  }
  return <span className="text-[13px] text-slate-400">N/A</span>;
}

export default function TaxReadinessPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [entries, setEntries] = useState<ReadinessEntry1099[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const { data } = await api.get<ReadinessEntry1099[]>('/documents/1099-readiness', { year });
        setEntries(data);
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [year]);

  const requiring1099 = entries.filter((e) => e.requires1099);
  const ready = requiring1099.filter((e) => e.isReady);
  const notReady = requiring1099.filter((e) => !e.isReady);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          1099 Readiness
        </h1>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl shadow-xs border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Requiring 1099</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{requiring1099.length}</p>
        </div>
        <div className="rounded-xl shadow-xs border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Ready</p>
          <p className="mt-1 text-2xl font-bold text-success-600">{ready.length}</p>
        </div>
        <div className="rounded-xl shadow-xs border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Not Ready</p>
          <p className="mt-1 text-2xl font-bold text-error-600">{notReady.length}</p>
        </div>
      </div>

      {/* Table (sm and up) */}
      <div className="mt-6 hidden rounded-xl border border-slate-200 bg-white overflow-x-auto sm:block">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-500">No domestic contractors found.</p>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Contractor
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  YTD Payments
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 hidden sm:table-cell">
                  W-9 Status
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 hidden sm:table-cell">
                  Requires 1099
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Ready
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.contractorId} className="h-12 border-b border-slate-50">
                  <td className="px-4 text-[13px] font-medium text-slate-900">
                    {entry.contractorName}
                  </td>
                  <td className="px-4 text-right text-[13px] font-mono text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(entry.ytdPayments)}
                  </td>
                  <td className="px-4 hidden sm:table-cell">
                    <DocumentStatusBadge status={entry.hasCurrentW9 ? 'current' : 'missing'} />
                  </td>
                  <td className="px-4 text-[13px] text-slate-600 hidden sm:table-cell">
                    {entry.requires1099 ? (
                      <span className="font-medium text-slate-900">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-4">
                    <ReadyBadge entry={entry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cards (below sm) */}
      <MobileCardList className="mt-6">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white py-20 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
            No domestic contractors found.
          </div>
        ) : (
          entries.map((entry) => (
            <MobileCard
              key={entry.contractorId}
              title={entry.contractorName}
              accessory={<ReadyBadge entry={entry} />}
            >
              <MobileCardRow label="YTD Payments">
                <span className="font-mono text-slate-900">
                  {formatCurrency(entry.ytdPayments)}
                </span>
              </MobileCardRow>
              <MobileCardRow label="W-9 Status">
                <DocumentStatusBadge
                  status={entry.hasCurrentW9 ? 'current' : 'missing'}
                />
              </MobileCardRow>
              <MobileCardRow label="Requires 1099">
                {entry.requires1099 ? (
                  <span className="font-medium text-slate-900">Yes</span>
                ) : (
                  <span className="text-slate-400">No</span>
                )}
              </MobileCardRow>
            </MobileCard>
          ))
        )}
      </MobileCardList>
    </div>
  );
}
