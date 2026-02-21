import { InvoiceStatus } from '@contractor-os/shared';

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { bg: string; text: string; label: string }
> = {
  [InvoiceStatus.DRAFT]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Draft',
  },
  [InvoiceStatus.SUBMITTED]: {
    bg: 'bg-info-50',
    text: 'text-info-700',
    label: 'Submitted',
  },
  [InvoiceStatus.UNDER_REVIEW]: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Under Review',
  },
  [InvoiceStatus.APPROVED]: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    label: 'Approved',
  },
  [InvoiceStatus.SCHEDULED]: {
    bg: 'bg-brand-50',
    text: 'text-brand-700',
    label: 'Scheduled',
  },
  [InvoiceStatus.PAID]: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    label: 'Paid',
  },
  [InvoiceStatus.DISPUTED]: {
    bg: 'bg-error-50',
    text: 'text-error-700',
    label: 'Disputed',
  },
  [InvoiceStatus.REJECTED]: {
    bg: 'bg-error-100',
    text: 'text-error-800',
    label: 'Rejected',
  },
  [InvoiceStatus.CANCELLED]: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    label: 'Cancelled',
  },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-sm ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
