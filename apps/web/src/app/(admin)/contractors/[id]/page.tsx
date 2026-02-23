'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/format';
import type { ContractorDetail } from '@contractor-os/shared';
import { Button } from '@/components/ui/button';
import { ContractorStatusBadge } from '@/components/contractors/contractor-status-badge';
import { RiskLevelBadge } from '@/components/contractors/risk-level-badge';
import { EngagementsTab } from '@/components/engagements/engagements-tab';
import { TimeEntriesTab } from '@/components/time-entries/time-entries-tab';
import { InvoicesTab } from '@/components/invoices/invoices-tab';
import { DocumentsTab } from '@/components/documents/documents-tab';
import { RiskTab } from '@/components/classification/risk-tab';
import { InitiationModal } from '@/components/offboarding/initiation-modal';
import { useAuth } from '@/hooks/use-auth';

const TABS = ['Overview', 'Engagements', 'Invoices', 'Documents', 'Risk', 'Time Entries'] as const;
type Tab = (typeof TABS)[number];

export default function ContractorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [contractor, setContractor] = useState<ContractorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [showOffboardModal, setShowOffboardModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<ContractorDetail>(
          `/contractors/${params.id}`,
        );
        setContractor(data);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 404) {
          setError('Contractor not found');
        } else {
          setError('Failed to load contractor');
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-500">{error || 'Contractor not found'}</p>
        <Link href="/contractors" className="mt-4 inline-block text-sm text-brand-500 hover:text-brand-600">
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
        <span className="font-medium text-slate-900">
          {contractor.firstName} {contractor.lastName}
        </span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-bold leading-tight text-slate-900">
              {contractor.firstName} {contractor.lastName}
            </h1>
            <ContractorStatusBadge status={contractor.status} variant="pill" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {contractor.email} · {contractor.type === 'domestic' ? 'Domestic' : 'Foreign'} contractor
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/contractors/${params.id}/edit`)}
            >
              Edit
            </Button>
            {contractor.status === 'active' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowOffboardModal(true)}
              >
                Offboard
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-brand-500 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'Overview' && <OverviewTab contractor={contractor} />}
        {activeTab === 'Engagements' && <EngagementsTab contractorId={contractor.id} />}
        {activeTab === 'Time Entries' && <TimeEntriesTab contractorId={contractor.id} />}
        {activeTab === 'Invoices' && <InvoicesTab contractorId={contractor.id} />}
        {activeTab === 'Documents' && <DocumentsTab contractorId={contractor.id} />}
        {activeTab === 'Risk' && <RiskTab contractorId={contractor.id} />}
      </div>

      {/* Offboard Modal */}
      {showOffboardModal && (
        <InitiationModal
          contractorName={`${contractor.firstName} ${contractor.lastName}`}
          onConfirm={async (data) => {
            const { data: result } = await api.post<{ id: string }>(
              `/contractors/${params.id}/offboard`,
              data,
            );
            router.push(`/offboarding/${result.id}`);
          }}
          onClose={() => setShowOffboardModal(false)}
        />
      )}
    </div>
  );
}

function OverviewTab({ contractor }: { contractor: ContractorDetail }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Onboarding Progress */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Onboarding</h3>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium text-slate-900">
              {contractor.onboarding.completedSteps}/{contractor.onboarding.totalSteps} steps
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-brand-500 transition-all"
              style={{
                width:
                  contractor.onboarding.totalSteps > 0
                    ? `${(contractor.onboarding.completedSteps / contractor.onboarding.totalSteps) * 100}%`
                    : '0%',
              }}
            />
          </div>
          {contractor.onboarding.steps.length > 0 && (
            <ul className="mt-4 space-y-2">
              {contractor.onboarding.steps.map((step) => (
                <li
                  key={step.id}
                  className="flex items-center gap-2 text-[13px]"
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                      step.status === 'completed'
                        ? 'bg-success-500 text-white'
                        : 'border border-slate-300 text-slate-400'
                    }`}
                  >
                    {step.status === 'completed' ? '✓' : ''}
                  </span>
                  <span
                    className={
                      step.status === 'completed'
                        ? 'text-slate-500 line-through'
                        : 'text-slate-700'
                    }
                  >
                    {formatStepType(step.stepType)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">
          Risk Assessment
        </h3>
        <div className="mt-4">
          {contractor.latestRiskAssessment ? (
            <>
              <RiskLevelBadge
                level={contractor.latestRiskAssessment.overallRisk}
                score={contractor.latestRiskAssessment.overallScore}
              />
              <p className="mt-3 text-[13px] text-slate-500">
                Assessed {formatDate(contractor.latestRiskAssessment.assessedAt)}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No assessment yet</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Summary</h3>
        <dl className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <dt className="text-[13px] text-slate-500">Active Engagements</dt>
            <dd className="text-sm font-medium text-slate-900">
              {contractor.activeEngagements}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[13px] text-slate-500">YTD Payments</dt>
            <dd className="text-sm font-medium font-mono text-slate-900">
              {formatCurrency(contractor.ytdPayments)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[13px] text-slate-500">Activated</dt>
            <dd className="text-sm text-slate-900">
              {formatDate(contractor.activatedAt)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[13px] text-slate-500">Joined</dt>
            <dd className="text-sm text-slate-900">
              {formatDate(contractor.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Document Status */}
      <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">
          Document Status
        </h3>
        <div className="mt-4 flex gap-6">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                contractor.documentStatus.hasCurrentW9
                  ? 'bg-success-500'
                  : 'bg-error-500'
              }`}
            />
            <span className="text-[13px] text-slate-600">
              W-9 {contractor.documentStatus.hasCurrentW9 ? 'on file' : 'missing'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                contractor.documentStatus.hasCurrentContract
                  ? 'bg-success-500'
                  : 'bg-error-500'
              }`}
            />
            <span className="text-[13px] text-slate-600">
              Contract{' '}
              {contractor.documentStatus.hasCurrentContract
                ? 'signed'
                : 'missing'}
            </span>
          </div>
          {contractor.documentStatus.expiringDocuments > 0 && (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning-500" />
              <span className="text-[13px] text-warning-700">
                {contractor.documentStatus.expiringDocuments} document
                {contractor.documentStatus.expiringDocuments > 1 ? 's' : ''}{' '}
                expiring soon
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Contact</h3>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-slate-400">
              Email
            </dt>
            <dd className="mt-0.5 text-[13px] text-slate-900">
              {contractor.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-slate-400">
              Type
            </dt>
            <dd className="mt-0.5 text-[13px] text-slate-900 capitalize">
              {contractor.type}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function formatStepType(type: string): string {
  const labels: Record<string, string> = {
    invite_accepted: 'Accept Invite',
    tax_form_submitted: 'Submit Tax Form',
    contract_signed: 'Sign Contract',
    bank_details_submitted: 'Add Bank Details',
  };
  return labels[type] ?? type;
}
