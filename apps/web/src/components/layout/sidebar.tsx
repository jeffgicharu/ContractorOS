'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Receipt,
  ShieldCheck,
  FolderOpen,
  UserMinus,
  ScrollText,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Contractors', href: '/contractors', icon: Users },
      { label: 'Onboarding', href: '/onboarding', icon: UserPlus },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Invoices', href: '/invoices', icon: FileText },
      { label: 'Tax', href: '/tax', icon: Receipt },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { label: 'Classification', href: '/classification', icon: ShieldCheck },
      { label: 'Documents', href: '/documents', icon: FolderOpen },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Offboarding', href: '/offboarding', icon: UserMinus },
      { label: 'Audit Log', href: '/audit', icon: ScrollText, adminOnly: true },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-gradient-to-b from-[#f0f2ff] via-[#f7f8fc] to-[#f4f5f8] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-14 items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <Link href="/dashboard" className="text-[15px] font-bold text-slate-900">
            ContractorOS
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto pl-3 pr-6 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-1">
              <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
              {group.items
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-50 text-brand-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-brand-500' : ''}`} />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* User profile + logout */}
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {user?.role === 'admin' ? 'Administrator' : 'Manager'}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
