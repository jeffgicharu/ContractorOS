'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Engagement } from '@contractor-os/shared';
import { api } from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { EngagementStatusBadge } from './engagement-status-badge';
import { EngagementForm } from './engagement-form';

interface EngagementsTabProps {
  contractorId: string;
}

export function EngagementsTab({ contractorId }: EngagementsTabProps) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<Engagement[]>(`/contractors/${contractorId}/engagements`);
      setEngagements(data);
    } catch {
      // silent — empty list on error
    } finally {
      setIsLoading(false);
    }
  }, [contractorId]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  function formatRate(e: Engagement): string {
    if (e.hourlyRate) return `${formatCurrency(e.hourlyRate)}/hr`;
    if (e.fixedRate) return `${formatCurrency(e.fixedRate)} fixed`;
    return '—';
  }

  function formatPaymentTerms(terms: string): string {
    return terms.replace('_', ' ').replace('net', 'Net');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          Engagements ({engagements.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          Create Engagement
        </Button>
      </div>

      {engagements.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">No engagements yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  Title
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  Status
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  Start Date
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  End Date
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  Rate
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500 border-b border-slate-200">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody>
              {engagements.map((e) => (
                <tr key={e.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-900 border-b border-slate-100">
                    {e.title}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100">
                    <EngagementStatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100">
                    {formatDate(e.startDate)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100">
                    {formatDate(e.endDate)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-right font-mono text-slate-900 border-b border-slate-100" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatRate(e)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100">
                    {formatPaymentTerms(e.paymentTerms)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <EngagementForm
          contractorId={contractorId}
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
