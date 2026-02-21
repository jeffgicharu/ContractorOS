import { EngagementStatus } from '@contractor-os/shared';

const STATUS_CONFIG: Record<
  EngagementStatus,
  { bg: string; text: string; label: string }
> = {
  [EngagementStatus.DRAFT]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Draft',
  },
  [EngagementStatus.ACTIVE]: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    label: 'Active',
  },
  [EngagementStatus.PAUSED]: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Paused',
  },
  [EngagementStatus.COMPLETED]: {
    bg: 'bg-info-50',
    text: 'text-info-700',
    label: 'Completed',
  },
  [EngagementStatus.CANCELLED]: {
    bg: 'bg-error-50',
    text: 'text-error-700',
    label: 'Cancelled',
  },
};

interface EngagementStatusBadgeProps {
  status: EngagementStatus;
}

export function EngagementStatusBadge({ status }: EngagementStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-sm ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
