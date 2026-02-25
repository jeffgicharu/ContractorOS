'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import { Header } from '@/components/layout/header';

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'contractor') {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <PortalSidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <div className="flex min-w-0 flex-1 flex-col pl-0 lg:pl-[240px]">
        <div className="relative z-10 flex min-h-screen flex-1 flex-col lg:rounded-l-[20px] lg:border-l lg:border-slate-200/60 bg-slate-50">
          <Header onMenuToggle={handleMenuToggle} />
          <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-[1280px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
