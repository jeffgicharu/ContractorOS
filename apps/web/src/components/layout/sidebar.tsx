'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Contractors', href: '/contractors' },
      { label: 'Onboarding', href: '/onboarding' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Invoices', href: '/invoices' },
      { label: 'Tax', href: '/tax' },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { label: 'Classification', href: '/classification' },
      { label: 'Documents', href: '/documents' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Offboarding', href: '/offboarding' },
      { label: 'Audit Log', href: '/audit' },
      { label: 'Settings', href: '/settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50">
      <div className="flex h-12 items-center px-4">
        <Link href="/dashboard" className="text-lg font-bold text-brand-600">
          ContractorOS
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-2">
            <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-400">
              {group.title}
            </p>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-9 items-center rounded-sm px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
