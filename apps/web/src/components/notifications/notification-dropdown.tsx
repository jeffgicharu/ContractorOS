'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import type { Notification } from '@contractor-os/shared';

const TYPE_COLORS: Record<string, string> = {
  invoice_submitted: 'bg-blue-500',
  invoice_approved: 'bg-green-500',
  invoice_rejected: 'bg-red-500',
  invoice_paid: 'bg-emerald-500',
  document_expiring: 'bg-amber-500',
  document_expired: 'bg-red-500',
  classification_risk_change: 'bg-orange-500',
  offboarding_started: 'bg-purple-500',
  offboarding_action_required: 'bg-purple-400',
  onboarding_reminder: 'bg-indigo-500',
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getNavigationPath(notification: Notification): string | null {
  const data = notification.data as Record<string, string>;
  switch (notification.type) {
    case 'invoice_submitted':
    case 'invoice_approved':
    case 'invoice_rejected':
    case 'invoice_paid':
      return data.invoiceId ? `/invoices/${data.invoiceId}` : '/invoices';
    case 'offboarding_started':
    case 'offboarding_action_required':
      return data.workflowId ? `/offboarding/${data.workflowId}` : '/offboarding';
    case 'classification_risk_change':
      return data.contractorId ? `/contractors/${data.contractorId}` : '/classification';
    case 'document_expiring':
    case 'document_expired':
      return '/documents';
    default:
      return null;
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markRead(notification.id);
    }
    const path = getNavigationPath(notification);
    if (path) {
      router.push(path);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative text-slate-500 hover:text-slate-700"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-slate-200 bg-white shadow-lg sm:w-80">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-medium text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-brand-500 hover:text-brand-600"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                    !n.readAt ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <span
                    className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                      TYPE_COLORS[n.type] ?? 'bg-slate-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{n.body}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.readAt && (
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
