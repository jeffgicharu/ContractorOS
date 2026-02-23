'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardStats {
  activeContractors: number;
  pendingInvoices: number;
  riskSummary: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    total: number;
  } | null;
  complianceRate: number;
  topRiskContractors: {
    contractorId: string;
    contractorName: string;
    overallRisk: string;
    overallScore: number;
  }[];
}

interface ChartData {
  monthlyRevenue: { month: string; label: string; total: number; count: number }[];
  invoiceBreakdown: { status: string; count: number }[];
  contractorBreakdown: { status: string; count: number }[];
  contractorGrowth: { month: string; label: string; total: number }[];
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const RISK_BAR_COLORS: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  submitted: '#6366f1',
  under_review: '#818cf8',
  approved: '#22c55e',
  rejected: '#ef4444',
  scheduled: '#f59e0b',
  paid: '#10b981',
};

const CONTRACTOR_STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  suspended: '#f59e0b',
  offboarded: '#94a3b8',
  invite_sent: '#6366f1',
  tax_form_pending: '#818cf8',
  contract_pending: '#a78bfa',
  bank_details_pending: '#c4b5fd',
};

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setIsLoading(true);
    try {
      const [contractorsRes, pendingRes, riskRes, complianceRes, chartRes] =
        await Promise.all([
          api.get<unknown[]>('/contractors', {
            status: 'active',
            page: 1,
            pageSize: 1,
          }) as Promise<{ data: unknown[]; meta: { total: number } }>,
          api.get<unknown[]>('/invoices', {
            status: 'submitted',
            page: 1,
            pageSize: 1,
          }) as Promise<{ data: unknown[]; meta: { total: number } }>,
          api
            .get<{
              summary: { low: number; medium: number; high: number; critical: number; total: number };
              topRiskContractors: { contractorId: string; contractorName: string; overallRisk: string; overallScore: number }[];
            }>('/classification/dashboard')
            .then((r) => (r as { data: typeof r extends { data: infer D } ? D : never }).data)
            .catch(() => null),
          api
            .get<{ contractorId: string; isCompliant: boolean }[]>('/documents/compliance-report')
            .then((r) => (r as { data: { contractorId: string; isCompliant: boolean }[] }).data)
            .catch(() => []),
          api
            .get<ChartData>('/dashboard/stats')
            .then((r) => (r as { data: ChartData }).data)
            .catch(() => null),
        ]);

      const compliantCount = complianceRes.filter((c) => c.isCompliant).length;

      setStats({
        activeContractors: contractorsRes.meta.total,
        pendingInvoices: pendingRes.meta.total,
        riskSummary: riskRes?.summary ?? null,
        topRiskContractors: riskRes?.topRiskContractors?.slice(0, 5) ?? [],
        complianceRate:
          complianceRes.length > 0
            ? Math.round((compliantCount / complianceRes.length) * 100)
            : 100,
      });
      setCharts(chartRes);
    } catch {
      setStats({
        activeContractors: 0,
        pendingInvoices: 0,
        riskSummary: null,
        topRiskContractors: [],
        complianceRate: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-[30px] font-bold leading-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your contractor operations</p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
          <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-tight text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Overview of your contractor operations</p>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/contractors" className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Active Contractors</p>
          <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats?.activeContractors ?? 0}
          </p>
          <p className="mt-1 text-xs text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">View all &rarr;</p>
        </Link>

        <Link href="/invoices" className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Pending Invoices</p>
          <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats?.pendingInvoices ?? 0}
          </p>
          <p className="mt-1 text-xs text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">Review &rarr;</p>
        </Link>

        <Link href="/classification" className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Risk Alerts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {(stats?.riskSummary?.high ?? 0) + (stats?.riskSummary?.critical ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-400">High + Critical risk</p>
        </Link>

        <Link href="/documents" className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Document Compliance</p>
          <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats?.complianceRate ?? 0}%
          </p>
          <p className="mt-1 text-xs text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">View report &rarr;</p>
        </Link>
      </div>

      {/* Charts Row 1: Revenue + Invoice Breakdown */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Revenue - takes 2 cols */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Monthly Revenue</h2>
          <p className="mt-1 text-xs text-slate-400">Last 6 months of paid invoices</p>
          {charts?.monthlyRevenue && charts.monthlyRevenue.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center">
              <p className="text-sm text-slate-400">No revenue data yet</p>
            </div>
          )}
        </div>

        {/* Invoice Status Breakdown - Donut */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Invoice Status</h2>
          <p className="mt-1 text-xs text-slate-400">Current distribution</p>
          {charts?.invoiceBreakdown && charts.invoiceBreakdown.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.invoiceBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                  >
                    {charts.invoiceBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={INVOICE_STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, formatStatus(name)]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Legend
                    formatter={(value: string) => formatStatus(value)}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center">
              <p className="text-sm text-slate-400">No invoice data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Contractor Breakdown + Risk Distribution */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contractor Status Breakdown */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Contractor Status</h2>
          <p className="mt-1 text-xs text-slate-400">Breakdown by lifecycle stage</p>
          {charts?.contractorBreakdown && charts.contractorBreakdown.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.contractorBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                    tickFormatter={formatStatus}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string) => [value, 'Count']}
                    labelFormatter={formatStatus}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {charts.contractorBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={CONTRACTOR_STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center">
              <p className="text-sm text-slate-400">No contractor data yet</p>
            </div>
          )}
        </div>

        {/* Risk Distribution + Top Risk */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Risk Distribution</h2>
          <p className="mt-1 text-xs text-slate-400">Classification risk levels</p>
          {stats?.riskSummary && stats.riskSummary.total > 0 ? (
            <div className="mt-4">
              <div className="space-y-3">
                {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
                  const count = stats.riskSummary![level as keyof typeof stats.riskSummary] as number;
                  const pct = stats.riskSummary!.total > 0 ? Math.round((count / stats.riskSummary!.total) * 100) : 0;
                  return (
                    <div key={level}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-slate-600">{level}</span>
                        <span className="font-medium text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${RISK_BAR_COLORS[level]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {stats.topRiskContractors.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-slate-400">Top Risk</h3>
                  <div className="mt-2 space-y-2">
                    {stats.topRiskContractors.map((c) => (
                      <Link
                        key={c.contractorId}
                        href={`/contractors/${c.contractorId}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-slate-50"
                      >
                        <span className="text-sm text-slate-700">{c.contractorName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.overallScore}</span>
                          <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${RISK_COLORS[c.overallRisk] ?? 'bg-slate-100 text-slate-600'}`}>
                            {c.overallRisk}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center">
              <p className="text-sm text-slate-400">No risk assessments yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/contractors/new" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
            Invite Contractor
          </Link>
          <Link href="/invoices" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Review Invoices
          </Link>
          <Link href="/onboarding" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Onboarding Pipeline
          </Link>
          <Link href="/documents" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Document Vault
          </Link>
          <Link href="/classification" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Risk Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
