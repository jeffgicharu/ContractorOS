'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { OffboardingWorkflowDetail, OffboardingStatus } from '@contractor-os/shared';
import {
  OFFBOARDING_TRANSITIONS,
  OffboardingStatus as OffboardingStatusEnum,
  EquipmentStatus,
} from '@contractor-os/shared';
import { Button } from '@/components/ui/button';
import { OffboardingStatusBadge } from '@/components/offboarding/offboarding-status-badge';
import { ProgressTracker } from '@/components/offboarding/progress-tracker';
import { ChecklistCard } from '@/components/offboarding/checklist-card';

const REASON_LABELS: Record<string, string> = {
  project_completed: 'Project Completed',
  budget_cut: 'Budget Cut',
  performance: 'Performance',
  mutual_agreement: 'Mutual Agreement',
  compliance_risk: 'Compliance Risk',
  other: 'Other',
};

const EQUIPMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [EquipmentStatus.ASSIGNED]: { label: 'Assigned', className: 'bg-info-50 text-info-700' },
  [EquipmentStatus.RETURN_REQUESTED]: { label: 'Return Requested', className: 'bg-warning-50 text-warning-700' },
  [EquipmentStatus.RETURNED]: { label: 'Returned', className: 'bg-success-50 text-success-700' },
  [EquipmentStatus.LOST]: { label: 'Lost', className: 'bg-error-50 text-error-700' },
};

export default function OffboardingDetailPage() {
  const params = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<OffboardingWorkflowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<OffboardingWorkflowDetail>(`/offboarding/${params.id}`);
      setWorkflow(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setError('Offboarding workflow not found');
      } else {
        setError('Failed to load offboarding workflow');
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function advanceStatus(newStatus: OffboardingStatus) {
    if (!workflow) return;
    setIsAdvancing(true);
    try {
      await api.patch(`/offboarding/${workflow.id}`, { status: newStatus });
      await load();
    } catch {
      // Silently handle, UI will show stale data
    } finally {
      setIsAdvancing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-500">{error || 'Workflow not found'}</p>
        <Link href="/offboarding" className="mt-4 inline-block text-sm text-brand-500 hover:text-brand-600">
          Back to offboarding
        </Link>
      </div>
    );
  }

  const nextStatuses = OFFBOARDING_TRANSITIONS[workflow.status] ?? [];
  const isTerminal =
    workflow.status === OffboardingStatusEnum.COMPLETED ||
    workflow.status === OffboardingStatusEnum.CANCELLED;
  const isEditable = !isTerminal;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-[13px] text-slate-400">
        <Link href="/offboarding" className="hover:text-slate-600">
          Offboarding
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">{workflow.contractorName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-bold leading-tight text-slate-900">
              {workflow.contractorName}
            </h1>
            <OffboardingStatusBadge status={workflow.status} variant="pill" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {REASON_LABELS[workflow.reason] ?? workflow.reason} · Effective{' '}
            {formatDate(workflow.effectiveDate)} · Initiated by {workflow.initiatedByName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nextStatuses
            .filter((s) => s !== OffboardingStatusEnum.CANCELLED)
            .map((status) => (
              <Button
                key={status}
                variant="primary"
                size="sm"
                isLoading={isAdvancing}
                onClick={() => advanceStatus(status)}
              >
                {status === OffboardingStatusEnum.IN_PROGRESS && 'Start Processing'}
                {status === OffboardingStatusEnum.PENDING_FINAL_INVOICE && 'Move to Pending Invoice'}
                {status === OffboardingStatusEnum.COMPLETED && 'Complete Offboarding'}
              </Button>
            ))}
          {nextStatuses.includes(OffboardingStatusEnum.CANCELLED) && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={isAdvancing}
              onClick={() => advanceStatus(OffboardingStatusEnum.CANCELLED)}
            >
              Cancel Workflow
            </Button>
          )}
          <Link href={`/contractors/${workflow.contractorId}`}>
            <Button variant="secondary" size="sm">
              View Contractor
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <ProgressTracker currentStatus={workflow.status} />
      </div>

      {/* Notes */}
      {workflow.notes && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
          <p className="mt-1 text-sm text-slate-600">{workflow.notes}</p>
        </div>
      )}

      {/* Main content grid */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Checklist */}
        <ChecklistCard
          workflowId={workflow.id}
          items={workflow.checklistItems}
          isEditable={isEditable}
          onUpdated={load}
        />

        {/* Equipment */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Equipment</h3>
          {workflow.equipment.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No equipment assigned to this contractor.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {workflow.equipment.map((eq) => {
                const statusConfig = EQUIPMENT_STATUS_CONFIG[eq.status] ?? {
                  label: eq.status,
                  className: 'bg-slate-100 text-slate-600',
                };
                return (
                  <li
                    key={eq.id}
                    className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">{eq.description}</div>
                      {eq.serialNumber && (
                        <div className="text-xs text-slate-400 font-mono">{eq.serialNumber}</div>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-sm ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="mt-6 flex gap-6 text-xs text-slate-400">
        <span>Created {formatDate(workflow.createdAt)}</span>
        {workflow.completedAt && <span>Completed {formatDate(workflow.completedAt)}</span>}
      </div>
    </div>
  );
}
