'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/format';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import type { InvoiceListItem, PaginationMeta } from '@contractor-os/shared';

const STATUS_TABS = [
  { label: 'All', value: 'paid,scheduled' },
  { label: 'Paid', value: 'paid' },
  { label: 'Scheduled', value: 'scheduled' },
];

export default function PortalPaymentsPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('paid,scheduled');

  // YTD summary
  const [ytdTotal, setYtdTotal] = useState(0);
  const [ytdCount, setYtdCount] = useState(0);

  useEffect(() => {
    loadYtdSummary();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [page, statusFilter]);

  async function loadYtdSummary() {
    try {
      const response = await api.get<InvoiceListItem[]>('/invoices', {
        status: 'paid',
        pageSize: 100,
      });
      const paidInvoices = response.data;
      const total = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      setYtdTotal(total);
      setYtdCount(paidInvoices.length);
    } catch {
      // Ignore
    }
  }

  async function loadPayments() {
    setIsLoading(true);
    try {
      const response = await api.get<InvoiceListItem[]>('/invoices', {
        status: statusFilter,
        page,
        pageSize: 20,
      });
      setInvoices(response.data);
      setMeta(response.meta ?? null);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-tight text-slate-900">
        Payments
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Your payment history and scheduled payments
      </p>

      {/* YTD Summary Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
            YTD Total Paid
          </p>
          <p
            className="mt-2 text-2xl font-bold text-slate-900"
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {formatCurrency(ytdTotal)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
            Payments Received
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ytdCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
            Avg Payment
          </p>
          <p
            className="mt-2 text-2xl font-bold text-slate-900"
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {ytdCount > 0 ? formatCurrency(ytdTotal / ytdCount) : '$0.00'}
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mt-8 border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Payments Table */}
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Due Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  </div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  No payments found
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/portal/invoices/${inv.id}`)}
                  className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span
                      className="text-[13px] font-medium text-slate-900"
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">
                    {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13px] font-medium text-slate-900"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {formatCurrency(inv.totalAmount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {(meta.page - 1) * meta.pageSize + 1}–
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
