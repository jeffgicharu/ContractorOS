'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { DocumentStatusBadge } from '@/components/documents/document-status-badge';
import { DOCUMENT_TYPE_LABELS, type TaxDocumentType, type ComplianceReportEntry } from '@contractor-os/shared';

const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Compliant', value: 'compliant' },
  { label: 'Non-Compliant', value: 'non-compliant' },
  { label: 'Expiring', value: 'expiring' },
];

function getDocTypeLabel(type: TaxDocumentType): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type;
}

export default function DocumentVaultPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ComplianceReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<ComplianceReportEntry[]>('/documents/compliance-report');
        setEntries(data);
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = entries.filter((entry) => {
    if (filter === 'compliant') return entry.isCompliant;
    if (filter === 'non-compliant') return !entry.isCompliant;
    if (filter === 'expiring') return entry.expiringDocuments.length > 0;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Document Vault
      </h1>

      {/* Filter tabs */}
      <div className="mt-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`pb-3 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'border-b-2 border-brand-500 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1.5 text-xs text-slate-400">
                  ({entries.filter((e) => {
                    if (tab.value === 'compliant') return e.isCompliant;
                    if (tab.value === 'non-compliant') return !e.isCompliant;
                    if (tab.value === 'expiring') return e.expiringDocuments.length > 0;
                    return true;
                  }).length})
                </span>
              )}
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
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-500">No contractors match this filter.</p>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Contractor
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  W-9 / W-8BEN
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Contract
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Expiring Docs
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Compliant
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const taxFormType = entry.contractorType === 'foreign' ? 'w8ben' : 'w9';
                const hasTaxForm = entry.currentDocuments.includes(taxFormType as TaxDocumentType);
                const hasContract = entry.currentDocuments.includes('contract' as TaxDocumentType);

                return (
                  <tr
                    key={entry.contractorId}
                    onClick={() => router.push(`/contractors/${entry.contractorId}?tab=Documents`)}
                    className="h-12 cursor-pointer border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 text-[13px] font-medium text-slate-900">
                      {entry.contractorName}
                      <span className="ml-2 text-xs text-slate-400">
                        {entry.contractorType === 'foreign' ? 'Foreign' : 'Domestic'}
                      </span>
                    </td>
                    <td className="px-4">
                      <DocumentStatusBadge status={hasTaxForm ? 'current' : 'missing'} />
                    </td>
                    <td className="px-4">
                      <DocumentStatusBadge status={hasContract ? 'current' : 'missing'} />
                    </td>
                    <td className="px-4 text-[13px] text-slate-600">
                      {entry.expiringDocuments.length > 0 ? (
                        <span className="text-warning-600 font-medium">
                          {entry.expiringDocuments.map((d) => getDocTypeLabel(d.type)).join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4">
                      {entry.isCompliant ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-md bg-success-50 text-success-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-md bg-error-50 text-error-700">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
