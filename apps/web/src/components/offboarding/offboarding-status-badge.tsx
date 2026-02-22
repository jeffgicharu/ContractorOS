import { OffboardingStatus } from '@contractor-os/shared';

const STATUS_CONFIG: Record<
  OffboardingStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  [OffboardingStatus.INITIATED]: {
    dot: 'bg-info-500',
    bg: 'bg-info-50',
    text: 'text-info-700',
    label: 'Initiated',
  },
  [OffboardingStatus.IN_PROGRESS]: {
    dot: 'bg-warning-500',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'In Progress',
  },
  [OffboardingStatus.PENDING_FINAL_INVOICE]: {
    dot: 'bg-orange-500',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    label: 'Pending Final Invoice',
  },
  [OffboardingStatus.COMPLETED]: {
    dot: 'bg-success-500',
    bg: 'bg-success-50',
    text: 'text-success-700',
    label: 'Completed',
  },
  [OffboardingStatus.CANCELLED]: {
    dot: 'bg-slate-400',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Cancelled',
  },
};

interface OffboardingStatusBadgeProps {
  status: OffboardingStatus;
  variant?: 'dot' | 'pill';
}

export function OffboardingStatusBadge({
  status,
  variant = 'dot',
}: OffboardingStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-sm ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
