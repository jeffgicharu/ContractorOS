'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

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
        {/* Notification bell placeholder */}
        <button
          type="button"
          className="relative text-slate-500 hover:text-slate-700"
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10 2C7.24 2 5 4.24 5 7V10.59L3.59 12C3.21 12.38 3 12.89 3 13.41V14C3 14.55 3.45 15 4 15H16C16.55 15 17 14.55 17 14V13.41C17 12.89 16.79 12.38 16.41 12L15 10.59V7C15 4.24 12.76 2 10 2ZM10 18C11.1 18 12 17.1 12 16H8C8 17.1 8.9 18 10 18Z"
              fill="currentColor"
            />
          </svg>
        </button>

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
