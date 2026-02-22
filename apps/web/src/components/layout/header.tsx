'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

export function Header() {
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
    <header className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div />

      <div className="flex items-center gap-4">
        <NotificationDropdown />

        {/* User avatar + dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-medium text-white">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900">
              {user?.firstName} {user?.lastName}
            </p>
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
    </header>
  );
}
