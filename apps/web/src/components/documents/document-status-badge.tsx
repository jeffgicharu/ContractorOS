type DocumentStatus = 'current' | 'expired' | 'expiring' | 'archived' | 'missing';

const STATUS_CONFIG: Record<DocumentStatus, { bg: string; text: string; label: string }> = {
  current: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    label: 'Current',
  },
  expired: {
    bg: 'bg-error-100',
    text: 'text-error-800',
    label: 'Expired',
  },
  expiring: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Expiring Soon',
  },
  archived: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    label: 'Archived',
  },
  missing: {
    bg: 'bg-white',
    text: 'text-error-600',
    label: 'Missing',
  },
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const extraClasses = status === 'missing' ? 'border border-error-300' : '';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-sm ${config.bg} ${config.text} ${extraClasses}`}
    >
      {config.label}
    </span>
  );
}

export function getDocumentStatus(doc: {
  isCurrent: boolean;
  expiresAt: string | null;
}): DocumentStatus {
  if (!doc.isCurrent) return 'archived';
  if (doc.expiresAt) {
    const expiry = new Date(doc.expiresAt);
    const now = new Date();
    if (expiry <= now) return 'expired';
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiry <= thirtyDays) return 'expiring';
  }
  return 'current';
}
