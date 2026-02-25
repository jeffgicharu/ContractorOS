'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { inviteAcceptSchema } from '@contractor-os/shared';
import { validateInviteToken, acceptInvite } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiClientError } from '@/lib/api-client';

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [contractorInfo, setContractorInfo] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const result = await validateInviteToken(params.token);
        setIsValid(result.valid);
        if (result.valid && result.contractor) {
          setContractorInfo(result.contractor);
          setFirstName(result.contractor.firstName);
          setLastName(result.contractor.lastName);
        }
      } catch {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    }
    validate();
  }, [params.token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setApiError('');

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    const result = inviteAcceptSchema.safeParse({
      token: params.token,
      password,
      firstName,
      lastName,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptInvite(params.token, password, firstName, lastName);
      router.push('/portal/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError(err.error.message);
      } else {
        setApiError('Failed to accept invite. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isValidating) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500">Validating invite...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-50">
          <span className="text-xl text-error-500">!</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Invalid or Expired Invite</h2>
        <p className="mt-2 text-sm text-slate-500">
          This invite link is no longer valid. Please contact your administrator
          to request a new invite.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Accept Invite</h2>
        {contractorInfo && (
          <p className="mt-1 text-sm text-slate-500">
            Set up your account for {contractorInfo.email}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3">
            <p className="text-sm text-error-700">{apiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors['password']}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors['confirmPassword']}
          autoComplete="new-password"
        />

        <p className="text-xs text-slate-400">
          Password must be at least 8 characters with uppercase, lowercase, and a number.
        </p>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Create Account
        </Button>
      </form>
    </div>
  );
}
