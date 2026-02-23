'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import { InvoiceTimeline } from '@/components/invoices/invoice-timeline';
import type { InvoiceDetail, InvoiceStatus } from '@contractor-os/shared';

export default function PortalInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  async function loadInvoice() {
    try {
      const { data } = await api.get<InvoiceDetail>(`/invoices/${params.id}`);
      setInvoice(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setError('Invoice not found');
      } else {
        setError('Failed to load invoice');
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      await api.post(`/invoices/${params.id}/${action}`);
      await loadInvoice();
    } catch {
      // Ignore
    } finally {
      setActionLoading('');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-500">{error || 'Invoice not found'}</p>
        <Link
          href="/portal/invoices"
          className="mt-4 inline-block text-sm text-brand-500 hover:text-brand-600"
        >
          Back to invoices
        </Link>
      </div>
    );
  }

  const actions = invoice.actions;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-[13px] text-slate-400">
        <Link href="/portal/invoices" className="hover:text-slate-600">
          Invoices
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">{invoice.invoiceNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-slate-900">
              {invoice.invoiceNumber}
            </h1>
            <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{invoice.engagement.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions.includes('submit') && (
            <Button
              size="sm"
              onClick={() => handleAction('submit')}
              isLoading={actionLoading === 'submit'}
            >
              Submit for Review
            </Button>
          )}
          {actions.includes('cancel') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('cancel')}
              isLoading={actionLoading === 'cancel'}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Details</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Period</dt>
              <dd className="text-sm text-slate-900">
                {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Due Date</dt>
              <dd className="text-sm text-slate-900">{formatDate(invoice.dueDate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Submitted</dt>
              <dd className="text-sm text-slate-900">{formatDate(invoice.submittedAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Amounts</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Subtotal</dt>
              <dd className="text-sm font-mono text-slate-900">{formatCurrency(invoice.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Tax</dt>
              <dd className="text-sm font-mono text-slate-900">{formatCurrency(invoice.taxAmount)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <dt className="text-sm font-semibold text-slate-900">Total</dt>
              <dd className="text-base font-bold font-mono text-slate-900">
                {formatCurrency(invoice.totalAmount)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Line items */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="text-base font-semibold text-slate-900">Line Items</h3>
        </div>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-slate-50">
                <td className="px-6 py-3 text-[13px] text-slate-700">{item.description}</td>
                <td className="px-4 py-3 text-right text-[13px] font-mono text-slate-700">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right text-[13px] font-mono text-slate-700">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-6 py-3 text-right text-[13px] font-mono font-medium text-slate-900">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Notes</h3>
          <p className="mt-2 text-[13px] text-slate-600">{invoice.notes}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Status History</h3>
        <div className="mt-4">
          <InvoiceTimeline history={invoice.statusHistory} />
        </div>
      </div>
    </div>
  );
}
