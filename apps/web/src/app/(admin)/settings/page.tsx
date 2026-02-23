'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  settings: {
    defaultPaymentTerms: string;
    defaultCurrency: string;
    reminderDays: number[];
  };
  createdAt: string;
  updatedAt: string;
}

const PAYMENT_TERMS_OPTIONS = [
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [currency, setCurrency] = useState('USD');
  const [reminderDays, setReminderDays] = useState('7, 3, 1');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const { data } = (await api.get<OrgSettings>(
        '/organizations/settings',
      )) as { data: OrgSettings };
      setOrg(data);
      setName(data.name);
      setPaymentTerms(data.settings.defaultPaymentTerms);
      setCurrency(data.settings.defaultCurrency);
      setReminderDays(data.settings.reminderDays.join(', '));
    } catch {
      setError('Failed to load organization settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    // Parse reminder days
    const parsedDays = reminderDays
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 90);

    if (parsedDays.length === 0) {
      setError('Please enter at least one valid reminder day (1–90)');
      setIsSaving(false);
      return;
    }

    try {
      const { data } = (await api.patch<OrgSettings>(
        '/organizations/settings',
        {
          name,
          defaultPaymentTerms: paymentTerms,
          defaultCurrency: currency,
          reminderDays: parsedDays,
        },
      )) as { data: OrgSettings };
      setOrg(data);
      setReminderDays(data.settings.reminderDays.join(', '));
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-[30px] font-bold leading-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organization settings.
        </p>
        <div className="mt-8 flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-tight text-slate-900">
        Settings
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isAdmin ? 'Manage your organization settings.' : 'View your organization settings.'}
      </p>

      {!isAdmin && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Only admins can modify organization settings.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-8 max-w-2xl space-y-8">
        {/* Organization Info */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Organization
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Basic details about your organization.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="org-name"
                className="block text-sm font-medium text-slate-700"
              >
                Organization Name
              </label>
              <input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Slug
              </label>
              <p className="mt-1 text-sm text-slate-500">
                {org?.slug ?? '—'}
              </p>
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* Invoice Defaults */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Invoice Defaults
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Default values applied to new invoices.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="payment-terms"
                className="block text-sm font-medium text-slate-700"
              >
                Default Payment Terms
              </label>
              <select
                id="payment-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                disabled={!isAdmin}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {PAYMENT_TERMS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-slate-700"
              >
                Default Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={!isAdmin}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* Reminders */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Reminders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Days before invoice due date to send reminders.
          </p>

          <div className="mt-4">
            <label
              htmlFor="reminder-days"
              className="block text-sm font-medium text-slate-700"
            >
              Reminder Days (comma-separated)
            </label>
            <input
              id="reminder-days"
              type="text"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              disabled={!isAdmin}
              placeholder="7, 3, 1"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              e.g. &quot;7, 3, 1&quot; sends reminders 7, 3, and 1 day(s) before due date
            </p>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* Meta info */}
        {org && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Info
            </h2>
            <div className="mt-4 space-y-2 text-sm text-slate-500">
              <p>
                Organization ID:{' '}
                <span className="font-mono text-xs text-slate-400">
                  {org.id}
                </span>
              </p>
              <p>
                Last updated:{' '}
                {new Date(org.updatedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </section>
        )}

        {isAdmin && (
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={loadSettings}
              disabled={isSaving}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
