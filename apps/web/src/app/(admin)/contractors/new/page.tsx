'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContractorType } from '@contractor-os/shared';

export default function NewContractorPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [type, setType] = useState<string>(ContractorType.DOMESTIC);
  const [engagementTitle, setEngagementTitle] = useState('');
  const [engagementStartDate, setEngagementStartDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        email,
        firstName,
        lastName,
        type,
      };
      if (engagementTitle) body.engagementTitle = engagementTitle;
      if (engagementStartDate) body.engagementStartDate = engagementStartDate;
      if (hourlyRate) body.hourlyRate = parseFloat(hourlyRate);

      const { data } = await api.post<{ id: string }>('/contractors', body);
      router.push(`/contractors/${data.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.error.message);
      } else {
        setError('Failed to create contractor');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-[13px] text-slate-400">
        <Link href="/contractors" className="hover:text-slate-600">
          Contractors
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">Add Contractor</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Add Contractor
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Basic Information
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="block w-full h-10 px-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg transition-[border-color,box-shadow] duration-150 ease-out hover:border-slate-300 focus:border-brand-500 focus:shadow-ring focus:outline-none"
              >
                <option value={ContractorType.DOMESTIC}>Domestic</option>
                <option value={ContractorType.FOREIGN}>Foreign</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optional Engagement */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Initial Engagement
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Optionally create an engagement when adding the contractor.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Engagement Title"
                name="engagementTitle"
                value={engagementTitle}
                onChange={(e) => setEngagementTitle(e.target.value)}
                placeholder="e.g. Frontend Development"
              />
            </div>
            <Input
              label="Start Date"
              name="engagementStartDate"
              type="date"
              value={engagementStartDate}
              onChange={(e) => setEngagementStartDate(e.target.value)}
            />
            <Input
              label="Hourly Rate"
              name="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/contractors')}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add Contractor
          </Button>
        </div>
      </form>
    </div>
  );
}
