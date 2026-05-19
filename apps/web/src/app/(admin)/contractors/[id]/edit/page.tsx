'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  updateContractorSchema,
  type ContractorDetail,
} from '@contractor-os/shared';

export default function EditContractorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<ContractorDetail>(
          `/contractors/${params.id}`,
        );
        setFirstName(data.firstName);
        setLastName(data.lastName);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 404) {
          setLoadError('Contractor not found');
        } else {
          setLoadError('Failed to load contractor');
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setErrors({});

    const fieldErrors: Record<string, string> = {};
    if (!firstName.trim()) fieldErrors['firstName'] = 'First name is required';
    if (!lastName.trim()) fieldErrors['lastName'] = 'Last name is required';

    const body: Record<string, unknown> = {
      firstName,
      lastName,
    };
    body.phone = phone ? phone : null;
    body.addressLine1 = addressLine1 ? addressLine1 : null;
    body.addressLine2 = addressLine2 ? addressLine2 : null;
    body.city = city ? city : null;
    body.state = state ? state : null;
    body.zipCode = zipCode ? zipCode : null;
    if (country) body.country = country;

    const result = updateContractorSchema.safeParse(body);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch(`/contractors/${params.id}`, result.data);
      router.push(`/contractors/${params.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.error.message);
      } else {
        setError('Failed to update contractor');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-500">{loadError}</p>
        <Link
          href="/contractors"
          className="mt-4 inline-block text-sm text-brand-500 hover:text-brand-600"
        >
          Back to contractors
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-[13px] text-slate-400">
        <Link href="/contractors" className="hover:text-slate-600">
          Contractors
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/contractors/${params.id}`}
          className="hover:text-slate-600"
        >
          {firstName} {lastName}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">Edit</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Edit Contractor
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-2xl space-y-6"
        noValidate
      >
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Name</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={errors['firstName']}
            />
            <Input
              label="Last Name"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors['lastName']}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Contact</h2>
          <div className="mt-4">
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              error={errors['phone']}
            />
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Address</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Address Line 1"
                name="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                error={errors['addressLine1']}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Address Line 2"
                name="addressLine2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                error={errors['addressLine2']}
              />
            </div>
            <Input
              label="City"
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={errors['city']}
            />
            <Input
              label="State / Province"
              name="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              error={errors['state']}
            />
            <Input
              label="ZIP / Postal Code"
              name="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              error={errors['zipCode']}
            />
            <Input
              label="Country"
              name="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="US"
              error={errors['country']}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/contractors/${params.id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
