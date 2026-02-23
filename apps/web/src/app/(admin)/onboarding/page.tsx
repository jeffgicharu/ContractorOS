'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { ContractorListItem } from '@contractor-os/shared';
import { ONBOARDING_STATUSES } from '@contractor-os/shared';
import { KanbanBoard } from '@/components/onboarding/kanban-board';

export default function OnboardingPipelinePage() {
  const [contractors, setContractors] = useState<ContractorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchContractors = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<ContractorListItem[]>('/contractors', {
        status: ONBOARDING_STATUSES.join(','),
        pageSize: 100,
        sortBy: 'created_at',
        sortDir: 'asc',
      });
      setContractors(data);
      setError('');
    } catch {
      setError('Failed to load onboarding pipeline');
      setContractors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Onboarding Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track contractor onboarding progress across stages
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-error-50 border border-error-200 px-4 py-3">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      <div className="mt-6">
        <KanbanBoard contractors={contractors} isLoading={isLoading} />
      </div>
    </div>
  );
}
