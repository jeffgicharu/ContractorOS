'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import {
  ContractorStatus,
  type ContractorListItem,
  type PaginationMeta,
} from '@contractor-os/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContractorStatusBadge } from '@/components/contractors/contractor-status-badge';
import { useAuth } from '@/hooks/use-auth';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: ContractorStatus.INVITE_SENT, label: 'Invite Sent' },
  { value: ContractorStatus.TAX_FORM_PENDING, label: 'Tax Form Pending' },
  { value: ContractorStatus.CONTRACT_PENDING, label: 'Contract Pending' },
  { value: ContractorStatus.BANK_DETAILS_PENDING, label: 'Bank Details Pending' },
  { value: ContractorStatus.ACTIVE, label: 'Active' },
  { value: ContractorStatus.SUSPENDED, label: 'Suspended' },
  { value: ContractorStatus.OFFBOARDED, label: 'Offboarded' },
] as const;

type SortField = 'created_at' | 'first_name' | 'last_name' | 'status' | 'email';

export default function ContractorListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [contractors, setContractors] = useState<ContractorListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchContractors = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: Record<string, string | number | boolean | undefined> = {
        page,
        pageSize: 20,
        sortBy,
        sortDir,
      };
      if (search) query['search'] = search;
      if (statusFilter) query['status'] = statusFilter;

      const response = await api.get<ContractorListItem[]>('/contractors', query);
      setContractors(response.data);
      setMeta(response.meta ?? null);
    } catch {
      // Error handled by empty state
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sortBy, sortDir, statusFilter]);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <span className="ml-1 text-slate-300">↕</span>;
    return <span className="ml-1 text-brand-500">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Contractors
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your contractor workforce
          </p>
        </div>
        {isAdmin && (
          <Link href="/contractors/new">
            <Button>Add Contractor</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900
            transition-[border-color,box-shadow] duration-150 ease-out
            hover:border-slate-400
            focus:border-brand-500 focus:shadow-ring focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200 cursor-pointer select-none"
                onClick={() => handleSort('first_name')}
              >
                Name <SortIcon field="first_name" />
              </th>
              <th
                className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200 cursor-pointer select-none"
                onClick={() => handleSort('email')}
              >
                Email <SortIcon field="email" />
              </th>
              <th
                className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200 cursor-pointer select-none"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon field="status" />
              </th>
              <th className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200">
                Type
              </th>
              <th
                className="sticky top-0 z-10 bg-slate-50/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400 border-b border-slate-200 cursor-pointer select-none"
                onClick={() => handleSort('created_at')}
              >
                Created <SortIcon field="created_at" />
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </td>
              </tr>
            ) : contractors.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  {search || statusFilter
                    ? 'No contractors match your filters'
                    : 'No contractors yet. Add your first contractor to get started.'}
                </td>
              </tr>
            ) : (
              contractors.map((contractor) => (
                <tr
                  key={contractor.id}
                  className="group hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-[13px] text-slate-900 border-b border-slate-50">
                    <Link
                      href={`/contractors/${contractor.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {contractor.firstName} {contractor.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 border-b border-slate-50">
                    {contractor.email}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-50">
                    <ContractorStatusBadge status={contractor.status} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 border-b border-slate-50 capitalize">
                    {contractor.type}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 border-b border-slate-50">
                    {formatDate(contractor.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-slate-500">
            Showing {(meta.page - 1) * meta.pageSize + 1}–
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-[13px] text-slate-600">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
