'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { OffboardingWorkflow, OffboardingStatus } from '@contractor-os/shared';
import { OffboardingStatusBadge } from '@/components/offboarding/offboarding-status-badge';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Initiated', value: 'initiated' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Pending Invoice', value: 'pending_final_invoice' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const;

type WorkflowListItem = OffboardingWorkflow & { contractorName: string; progress: number };

export default function OffboardingPage() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: Record<string, string | number> = { page: meta.page, limit: meta.pageSize };
      if (statusFilter) query.status = statusFilter;

      const { data, meta: responseMeta } = await api.get<WorkflowListItem[]>('/offboarding', query) as {
        data: WorkflowListItem[];
        meta: { page: number; pageSize: number; total: number; totalPages: number };
      };
      setWorkflows(data);
      setMeta(responseMeta);
    } catch {
      setError('Failed to load offboarding workflows');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, meta.page, meta.pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setMeta((prev) => ({ ...prev, page: 1 }));
  }

  const REASON_LABELS: Record<string, string> = {
    project_completed: 'Project Completed',
    budget_cut: 'Budget Cut',
    performance: 'Performance',
    mutual_agreement: 'Mutual Agreement',
    compliance_risk: 'Compliance Risk',
    other: 'Other',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Offboarding Workflows
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage contractor offboarding checklists, equipment returns, and final invoices.
      </p>

      {/* Status filter tabs */}
      <div className="mt-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className={`whitespace-nowrap shrink-0 pb-3 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'border-b-2 border-brand-500 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-400">No offboarding workflows found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                      Contractor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 hidden sm:table-cell">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 hidden sm:table-cell">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 hidden sm:table-cell">
                      Effective Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 hidden sm:table-cell">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((w) => (
                    <tr
                      key={w.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/offboarding/${w.id}`}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          {w.contractorName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 hidden sm:table-cell">
                        {REASON_LABELS[w.reason] ?? w.reason}
                      </td>
                      <td className="px-4 py-3">
                        <OffboardingStatusBadge status={w.status as OffboardingStatus} variant="pill" />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-brand-500"
                              style={{ width: `${w.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {w.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 hidden sm:table-cell">
                        {formatDate(w.effectiveDate)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-500 hidden sm:table-cell">
                        {formatDate(w.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
