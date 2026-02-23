'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/format';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import type { InvoiceListItem, PaginationMeta, InvoiceStatus } from '@contractor-os/shared';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending Review', value: 'submitted,under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Paid', value: 'paid' },
  { label: 'Disputed', value: 'disputed' },
  { label: 'Draft', value: 'draft' },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const query: Record<string, string | number | boolean | undefined> = {
          page,
          pageSize: 20,
        };
        if (statusFilter) query.status = statusFilter;

        const response = await api.get<InvoiceListItem[]>('/invoices', query);
        setInvoices(response.data);
        setMeta(response.meta ?? null);
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [page, statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Invoices
        </h1>
      </div>

      {/* Status tabs */}
      <div className="mt-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`pb-3 text-sm font-medium transition-colors ${
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

      {/* Table */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-500">No invoices found.</p>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Invoice #
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Contractor
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Status
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Amount
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Submitted
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  className="h-12 cursor-pointer border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 text-[13px] font-mono font-medium text-slate-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 text-[13px] text-slate-700">
                    {inv.contractorName}
                  </td>
                  <td className="px-4">
                    <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
                  </td>
                  <td className="px-4 text-right text-[13px] font-mono text-slate-900">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="px-4 text-[13px] text-slate-600">
                    {formatDate(inv.submittedAt)}
                  </td>
                  <td className="px-4 text-[13px] text-slate-600">
                    {formatDate(inv.dueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Showing {(meta.page - 1) * meta.pageSize + 1}–
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
