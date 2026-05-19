'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  createInvoiceSchema,
  type Engagement,
  type Invoice,
} from '@contractor-os/shared';

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [engagementId, setEngagementId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: '', unitPrice: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadEngagements() {
      try {
        // Contractor sees their own engagements — the API scopes automatically
        // We'll get engagements from the time-entries page pattern
        const { data } = await api.get<Engagement[]>('/invoices', {
          pageSize: 1,
        });
        // Actually let's just try to get all engagements list
      } catch {
        // Ignore
      }
    }
    loadEngagements();
  }, []);

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: '', unitPrice: '' }]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    const updated = [...lineItems];
    updated[index] = { ...updated[index]!, [field]: value };
    setLineItems(updated);
  }

  function calculateTotal(): number {
    return lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setErrors({});

    const body = {
      engagementId,
      invoiceNumber,
      periodStart,
      periodEnd,
      notes: notes || undefined,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      })),
    };

    const result = createInvoiceSchema.safeParse(body);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post<Invoice>('/invoices', result.data);
      router.push(`/portal/invoices/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Create Invoice</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        )}

        {/* Basic info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Invoice Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Engagement
                <input
                  type="text"
                  name="engagementId"
                  value={engagementId}
                  onChange={(e) => setEngagementId(e.target.value)}
                  placeholder="Engagement ID"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                    errors['engagementId']
                      ? 'border-error-500'
                      : 'border-slate-200'
                  }`}
                />
              </label>
              {errors['engagementId'] && (
                <p className="mt-1.5 text-[13px] text-error-600">
                  {errors['engagementId']}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Invoice Number
                <input
                  type="text"
                  name="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-005"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                    errors['invoiceNumber']
                      ? 'border-error-500'
                      : 'border-slate-200'
                  }`}
                />
              </label>
              {errors['invoiceNumber'] && (
                <p className="mt-1.5 text-[13px] text-error-600">
                  {errors['invoiceNumber']}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Period Start
                <input
                  type="date"
                  name="periodStart"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                    errors['periodStart']
                      ? 'border-error-500'
                      : 'border-slate-200'
                  }`}
                />
              </label>
              {errors['periodStart'] && (
                <p className="mt-1.5 text-[13px] text-error-600">
                  {errors['periodStart']}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Period End
                <input
                  type="date"
                  name="periodEnd"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                    errors['periodEnd']
                      ? 'border-error-500'
                      : 'border-slate-200'
                  }`}
                />
              </label>
              {errors['periodEnd'] && (
                <p className="mt-1.5 text-[13px] text-error-600">
                  {errors['periodEnd']}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Notes
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                    errors['notes'] ? 'border-error-500' : 'border-slate-200'
                  }`}
                />
              </label>
              {errors['notes'] && (
                <p className="mt-1.5 text-[13px] text-error-600">
                  {errors['notes']}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Line Items</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              + Add Item
            </button>
          </div>
          {errors['lineItems'] && (
            <p className="mt-2 text-[13px] text-error-600">
              {errors['lineItems']}
            </p>
          )}
          <div className="mt-4 space-y-3">
            {lineItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-5">
                  <span className="text-xs font-medium text-slate-500">Description</span>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                    placeholder="Work description"
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm ${
                      errors[`lineItems.${idx}.description`]
                        ? 'border-error-500'
                        : 'border-slate-200'
                    }`}
                  />
                  {errors[`lineItems.${idx}.description`] && (
                    <p className="mt-1.5 text-[13px] text-error-600">
                      {errors[`lineItems.${idx}.description`]}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs font-medium text-slate-500">Quantity</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                    placeholder="0"
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-right font-mono ${
                      errors[`lineItems.${idx}.quantity`]
                        ? 'border-error-500'
                        : 'border-slate-200'
                    }`}
                  />
                  {errors[`lineItems.${idx}.quantity`] && (
                    <p className="mt-1.5 text-[13px] text-error-600">
                      {errors[`lineItems.${idx}.quantity`]}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs font-medium text-slate-500">Unit Price</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-right font-mono ${
                      errors[`lineItems.${idx}.unitPrice`]
                        ? 'border-error-500'
                        : 'border-slate-200'
                    }`}
                  />
                  {errors[`lineItems.${idx}.unitPrice`] && (
                    <p className="mt-1.5 text-[13px] text-error-600">
                      {errors[`lineItems.${idx}.unitPrice`]}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2 text-right">
                  <span className="text-xs font-medium text-slate-500">Amount</span>
                  <div className="mt-1 py-2 text-sm font-mono font-medium text-slate-900">
                    {formatCurrency(
                      (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
                    )}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="mt-1 p-2 text-slate-400 hover:text-error-500"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-50 pt-4 flex justify-end">
            <div className="text-right">
              <span className="text-sm text-slate-500">Total: </span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Draft
          </Button>
        </div>
      </form>
    </div>
  );
}
