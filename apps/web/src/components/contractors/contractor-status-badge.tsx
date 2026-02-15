import { ContractorStatus } from '@contractor-os/shared';

const STATUS_CONFIG: Record<
  ContractorStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  [ContractorStatus.INVITE_SENT]: {
    dot: 'bg-info-500',
    bg: 'bg-info-50',
    text: 'text-info-700',
    label: 'Invite Sent',
  },
  [ContractorStatus.TAX_FORM_PENDING]: {
    dot: 'bg-warning-500',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Tax Form Pending',
  },
  [ContractorStatus.CONTRACT_PENDING]: {
    dot: 'bg-warning-500',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Contract Pending',
  },
  [ContractorStatus.BANK_DETAILS_PENDING]: {
    dot: 'bg-warning-500',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Bank Details Pending',
  },
  [ContractorStatus.ACTIVE]: {
    dot: 'bg-success-500',
    bg: 'bg-success-50',
    text: 'text-success-700',
    label: 'Active',
  },
  [ContractorStatus.SUSPENDED]: {
    dot: 'bg-orange-500',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    label: 'Suspended',
  },
  [ContractorStatus.OFFBOARDED]: {
    dot: 'bg-slate-400',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Offboarded',
  },
};

interface ContractorStatusBadgeProps {
  status: ContractorStatus;
  variant?: 'dot' | 'pill';
}

export function ContractorStatusBadge({
  status,
  variant = 'dot',
}: ContractorStatusBadgeProps) {
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
