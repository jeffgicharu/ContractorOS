'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/format';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { InvoiceListItem, InvoiceStatus } from '@contractor-os/shared';

interface InvoicesTabProps {
  contractorId: string;
}

export function InvoicesTab({ contractorId }: InvoicesTabProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<InvoiceListItem[]>('/invoices', {
          contractorId,
          pageSize: 50,
        });
        setInvoices(data);
      } catch {
        // Ignore errors
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [contractorId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">No invoices found for this contractor.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50">
            <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
              Invoice #
            </th>
            <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
              Period
            </th>
            <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
              Status
            </th>
            <th className="sticky top-0 z-10 px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
              Amount
            </th>
            <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
              Due Date
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              onClick={() => router.push(`/invoices/${inv.id}`)}
              className="h-12 cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="px-4 text-[13px] font-mono font-medium text-slate-900">
                {inv.invoiceNumber}
              </td>
              <td className="px-4 text-[13px] text-slate-600">
                {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
              </td>
              <td className="px-4">
                <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
              </td>
              <td className="px-4 text-right text-[13px] font-mono text-slate-900">
                {formatCurrency(inv.totalAmount)}
              </td>
              <td className="px-4 text-[13px] text-slate-600">
                {formatDate(inv.dueDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
