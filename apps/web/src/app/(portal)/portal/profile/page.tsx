'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

interface ContractorProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  type: string;
  activatedAt: string | null;
  createdAt: string;
  onboarding: {
    completedSteps: number;
    totalSteps: number;
  };
  activeEngagements: number;
  documentStatus: {
    hasCurrentW9: boolean;
    hasCurrentContract: boolean;
    expiringDocuments: number;
  };
  ytdPayments: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-amber-100 text-amber-700',
  offboarded: 'bg-slate-100 text-slate-600',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const { data } = (await api.get<ContractorProfile>(
        '/contractors/me',
      )) as { data: ContractorProfile };
      setProfile(data);
    } catch {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch {
      setPasswordError('Failed to change password. Check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-[30px] font-bold leading-tight text-slate-900">
          Profile
        </h1>
        <div className="mt-8 flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-[30px] font-bold leading-tight text-slate-900">
          Profile
        </h1>
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-tight text-slate-900">
        Profile
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Your account details and settings
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Personal Information
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  First Name
                </label>
                <p className="mt-1 text-sm text-slate-900">
                  {profile?.firstName}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Last Name
                </label>
                <p className="mt-1 text-sm text-slate-900">
                  {profile?.lastName}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Email
                </label>
                <p className="mt-1 text-sm text-slate-900">
                  {user?.email}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Contractor Type
                </label>
                <p className="mt-1 text-sm capitalize text-slate-900">
                  {profile?.type}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Status
                </label>
                <p className="mt-1">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-xs font-medium capitalize ${
                      STATUS_COLORS[profile?.status ?? ''] ??
                      'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {profile?.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Member Since
                </label>
                <p className="mt-1 text-sm text-slate-900">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Document Status */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Compliance Status
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-slate-100 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  W-9 on File
                </p>
                <p className="mt-1 text-sm font-medium">
                  {profile?.documentStatus.hasCurrentW9 ? (
                    <span className="text-green-600">Current</span>
                  ) : (
                    <span className="text-red-600">Missing</span>
                  )}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Contract
                </p>
                <p className="mt-1 text-sm font-medium">
                  {profile?.documentStatus.hasCurrentContract ? (
                    <span className="text-green-600">Current</span>
                  ) : (
                    <span className="text-red-600">Missing</span>
                  )}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Expiring Documents
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {profile?.documentStatus.expiringDocuments ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Change Password
            </h2>

            {passwordError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Avatar + Name */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
              {profile?.firstName?.[0]}
              {profile?.lastName?.[0]}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              {profile?.firstName} {profile?.lastName}
            </h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-1">
              <span
                className={`rounded-sm px-2 py-0.5 text-xs font-medium capitalize ${
                  STATUS_COLORS[profile?.status ?? ''] ??
                  'bg-slate-100 text-slate-600'
                }`}
              >
                {profile?.status}
              </span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">
              Quick Stats
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Active Engagements
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {profile?.activeEngagements ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">YTD Payments</span>
                <span
                  className="text-sm font-medium text-slate-900"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  $
                  {(profile?.ytdPayments ?? 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Onboarding</span>
                <span className="text-sm font-medium text-slate-900">
                  {profile?.onboarding.completedSteps}/
                  {profile?.onboarding.totalSteps} steps
                </span>
              </div>
            </div>
          </div>

          {/* Contractor ID */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">
              Contractor ID
            </h3>
            <p className="mt-2 break-all font-mono text-xs text-slate-400">
              {profile?.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
