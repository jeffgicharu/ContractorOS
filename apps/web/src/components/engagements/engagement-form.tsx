'use client';

import { useState } from 'react';
import {
  createEngagementSchema,
  type CreateEngagementInput,
  PaymentTerms,
} from '@contractor-os/shared';
import { api, ApiClientError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EngagementFormProps {
  contractorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EngagementForm({ contractorId, onSuccess, onCancel }: EngagementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const form = new FormData(e.currentTarget);

    const raw = {
      title: form.get('title') as string,
      description: (form.get('description') as string) || undefined,
      startDate: form.get('startDate') as string,
      endDate: (form.get('endDate') as string) || undefined,
      hourlyRate: form.get('hourlyRate') ? Number(form.get('hourlyRate')) : undefined,
      fixedRate: form.get('fixedRate') ? Number(form.get('fixedRate')) : undefined,
      currency: (form.get('currency') as string) || 'USD',
      paymentTerms: form.get('paymentTerms') as string,
    };

    const result = createEngagementSchema.safeParse(raw);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/contractors/${contractorId}/engagements`, result.data);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to create engagement');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Create Engagement</h2>

        {error && (
          <div className="mt-3 rounded-md bg-error-50 px-3 py-2 text-sm text-error-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Title"
            name="title"
            placeholder="e.g. Frontend Dashboard Redesign"
            error={fieldErrors['title']}
            required
          />

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="block w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:shadow-ring focus:outline-none"
              placeholder="Describe the scope of work..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              error={fieldErrors['startDate']}
              required
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              error={fieldErrors['endDate']}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hourly Rate"
              name="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              placeholder="150.00"
              error={fieldErrors['hourlyRate']}
            />
            <Input
              label="Fixed Rate"
              name="fixedRate"
              type="number"
              step="0.01"
              min="0"
              placeholder="12000.00"
              error={fieldErrors['fixedRate']}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Currency"
              name="currency"
              defaultValue="USD"
              maxLength={3}
            />
            <div>
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-slate-700 mb-1.5">
                Payment Terms
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                defaultValue={PaymentTerms.NET_30}
                className="block w-full h-9 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md hover:border-slate-400 focus:border-brand-500 focus:shadow-ring focus:outline-none"
              >
                <option value={PaymentTerms.NET_15}>Net 15</option>
                <option value={PaymentTerms.NET_30}>Net 30</option>
                <option value={PaymentTerms.NET_45}>Net 45</option>
                <option value={PaymentTerms.NET_60}>Net 60</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Engagement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
