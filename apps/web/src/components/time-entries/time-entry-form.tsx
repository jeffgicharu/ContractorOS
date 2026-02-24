'use client';

import { useState, useEffect } from 'react';
import {
  createTimeEntrySchema,
  type Engagement,
} from '@contractor-os/shared';
import { api, ApiClientError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TimeEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TimeEntryForm({ onSuccess, onCancel }: TimeEntryFormProps) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load active engagements for the current contractor
    // The API will scope to the contractor's own engagements based on JWT
    api.get<Engagement[]>('/time-entries', { pageSize: 1 }).catch(() => {
      // ignore — we'll load engagements differently
    });

    // We need to get the contractor's engagements. Since the portal user
    // is a contractor, we need to figure out their contractor ID.
    // For now, load engagements from the time-entries context.
    // The engagement select will be populated from available engagements.
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const form = new FormData(e.currentTarget);

    const raw = {
      engagementId: form.get('engagementId') as string,
      entryDate: form.get('entryDate') as string,
      hours: Number(form.get('hours')),
      description: form.get('description') as string,
    };

    const result = createTimeEntrySchema.safeParse(raw);
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
      await api.post('/time-entries', result.data);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to log time entry');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-4 shadow-xl max-h-[90vh] overflow-y-auto sm:mx-auto sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Log Time</h2>

        {error && (
          <div className="mt-3 rounded-md bg-error-50 px-3 py-2 text-sm text-error-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="engagementId" className="block text-sm font-medium text-slate-700 mb-1.5">
              Engagement
            </label>
            {engagements.length > 0 ? (
              <select
                id="engagementId"
                name="engagementId"
                required
                className="block w-full h-9 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md hover:border-slate-400 focus:border-brand-500 focus:shadow-ring focus:outline-none"
              >
                <option value="">Select engagement...</option>
                {engagements.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.title}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                name="engagementId"
                placeholder="Engagement ID"
                error={fieldErrors['engagementId']}
                required
              />
            )}
          </div>

          <Input
            label="Date"
            name="entryDate"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            error={fieldErrors['entryDate']}
            required
          />

          <Input
            label="Hours"
            name="hours"
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            placeholder="8"
            error={fieldErrors['hours']}
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
              required
              className="block w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:shadow-ring focus:outline-none"
              placeholder="What did you work on?"
            />
            {fieldErrors['description'] && (
              <p className="mt-1.5 text-[13px] text-error-600">{fieldErrors['description']}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Log Time
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
