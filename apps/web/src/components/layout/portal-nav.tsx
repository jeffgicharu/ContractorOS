'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

const PORTAL_LINKS = [
  { label: 'Dashboard', href: '/portal/dashboard' },
  { label: 'Time Entries', href: '/portal/time-entries' },
  { label: 'Invoices', href: '/portal/invoices' },
  { label: 'Documents', href: '/portal/documents' },
  { label: 'Payments', href: '/portal/payments' },
  { label: 'Profile', href: '/portal/profile' },
];

export function PortalNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '';

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-8">
        <Link href="/portal/dashboard" className="text-lg font-bold text-brand-600">
          ContractorOS
        </Link>

        <nav className="flex items-center gap-8">
          {PORTAL_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-b-2 border-brand-500 text-brand-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-medium text-white">
              {initials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
