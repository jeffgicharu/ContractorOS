'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

const PATH_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  contractors: 'Contractors',
  invoices: 'Invoices',
  onboarding: 'Onboarding',
  documents: 'Document Vault',
  classification: 'Classification',
  offboarding: 'Offboarding',
  audit: 'Audit Log',
  settings: 'Settings',
  tax: '1099 Readiness',
  portal: 'Portal',
  'time-entries': 'Time Entries',
  payments: 'Payments',
  profile: 'Profile',
  new: 'New',
  edit: 'Edit',
};

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(s);
}

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  // Skip "portal" as a breadcrumb segment — it's a route group
  const filtered = segments.filter((s) => s !== 'portal');

  let path = '';
  for (const seg of filtered) {
    // For admin routes, build path without portal prefix
    // For portal routes, re-insert /portal
    if (segments.includes('portal') && crumbs.length === 0) {
      path = '/portal';
    }
    path += `/${seg}`;

    if (isUuid(seg)) {
      crumbs.push({ label: 'Detail', href: path });
    } else {
      crumbs.push({
        label: PATH_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        href: path,
      });
    }
  }

  return crumbs;
}

export function Header() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <header className="flex h-10 items-center justify-between px-8 pt-4">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        {breadcrumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            )}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-slate-900">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        ))}
      </nav>

      {/* Right: Action icons */}
      <div className="flex items-center gap-1">
        <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-600">
          <Search className="h-[18px] w-[18px]" />
        </button>
        <NotificationDropdown />
      </div>
    </header>
  );
}
