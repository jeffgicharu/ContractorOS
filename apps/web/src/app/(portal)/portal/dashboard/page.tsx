'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PortalStats {
  pendingInvoices: number;
  totalPaidYtd: number;
  totalInvoices: number;
}

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  submittedAt: string | null;
  createdAt: string;
}

interface MonthlyEarning {
  month: string;
  label: string;
  total: number;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-indigo-100 text-indigo-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  scheduled: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceListItem[]>([]);
  const [earnings, setEarnings] = useState<MonthlyEarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortalData();
  }, []);

  async function loadPortalData() {
    setIsLoading(true);
    try {
      const [allRes, pendingRes, paidRes, earningsRes] = await Promise.all([
        api.get<InvoiceListItem[]>('/invoices', { page: 1, pageSize: 5 }) as Promise<{
          data: InvoiceListItem[];
          meta: { total: number };
        }>,
        api.get<InvoiceListItem[]>('/invoices', {
          status: 'submitted,under_review',
          page: 1,
          pageSize: 1,
        }) as Promise<{ data: InvoiceListItem[]; meta: { total: number } }>,
        api.get<InvoiceListItem[]>('/invoices', {
          status: 'paid',
          page: 1,
          pageSize: 100,
        }) as Promise<{ data: InvoiceListItem[]; meta: { total: number } }>,
        api
          .get<{ monthlyEarnings: MonthlyEarning[] }>('/dashboard/portal-stats')
          .then((r) => (r as { data: { monthlyEarnings: MonthlyEarning[] } }).data.monthlyEarnings)
          .catch(() => []),
      ]);

      const paidTotal = paidRes.data.reduce(
        (sum: number, inv: InvoiceListItem) => sum + inv.totalAmount,
        0,
      );

      setStats({
        totalInvoices: allRes.meta.total,
        pendingInvoices: pendingRes.meta.total,
        totalPaidYtd: paidTotal,
      });
      setRecentInvoices(allRes.data);
      setEarnings(earningsRes);
    } catch {
      setStats({ totalInvoices: 0, pendingInvoices: 0, totalPaidYtd: 0 });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contractor Portal</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back{user ? `, ${user.firstName}` : ''}</p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contractor Portal</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back{user ? `, ${user.firstName}` : ''}</p>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-sm font-medium text-slate-500">Pending Invoices</p>
          <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats?.pendingInvoices ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-sm font-medium text-slate-500">Total Paid YTD</p>
          <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono, monospace' }}>
            ${(stats?.totalPaidYtd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-sm font-medium text-slate-500">Total Invoices</p>
          <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats?.totalInvoices ?? 0}
          </p>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900">Monthly Earnings</h2>
        <p className="mt-1 text-xs text-slate-400">Last 6 months of paid invoices</p>
        {earnings.length > 0 ? (
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Earnings']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 flex h-56 items-center justify-center">
            <p className="text-sm text-slate-400">No earnings data yet</p>
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Invoices</h2>
          <Link href="/portal/invoices" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all &rarr;
          </Link>
        </div>

        {recentInvoices.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">Invoice #</th>
                <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">Amount</th>
                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">Status</th>
                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3">
                    <Link
                      href={`/portal/invoices/${inv.id}`}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-slate-900" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono, monospace' }}>
                    ${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {inv.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500">
                    {new Date(inv.submittedAt ?? inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-400">No invoices yet.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/portal/invoices/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-brand-700">
          Submit Invoice
        </Link>
        <Link href="/portal/documents" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50">
          Upload Document
        </Link>
        <Link href="/portal/invoices" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50">
          View Invoices
        </Link>
      </div>
    </div>
  );
}
