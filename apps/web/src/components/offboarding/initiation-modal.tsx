'use client';

import { useState } from 'react';
import { OffboardingReason } from '@contractor-os/shared';
import { Button } from '@/components/ui/button';

const REASON_LABELS: Record<string, string> = {
  [OffboardingReason.PROJECT_COMPLETED]: 'Project Completed',
  [OffboardingReason.BUDGET_CUT]: 'Budget Cut',
  [OffboardingReason.PERFORMANCE]: 'Performance',
  [OffboardingReason.MUTUAL_AGREEMENT]: 'Mutual Agreement',
  [OffboardingReason.COMPLIANCE_RISK]: 'Compliance Risk',
  [OffboardingReason.OTHER]: 'Other',
};

interface InitiationModalProps {
  contractorName: string;
  onConfirm: (data: { reason: string; effectiveDate: string; notes?: string }) => Promise<void>;
  onClose: () => void;
}

export function InitiationModal({ contractorName, onConfirm, onClose }: InitiationModalProps) {
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || !effectiveDate) {
      setError('Reason and effective date are required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm({
        reason,
        effectiveDate,
        notes: notes || undefined,
      });
    } catch {
      setError('Failed to initiate offboarding');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-4 shadow-xl max-h-[90vh] overflow-y-auto sm:mx-auto sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Offboard Contractor</h2>
        <p className="mt-1 text-sm text-slate-500">
          Initiate offboarding for <span className="font-medium text-slate-700">{contractorName}</span>.
          This will create a checklist and begin the offboarding workflow.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Select a reason...</option>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Notes <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Add context for the offboarding..."
            />
          </div>

          {error && (
            <p className="text-sm text-error-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              isLoading={isSubmitting}
            >
              Initiate Offboarding
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
