import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef1ff] via-[#f5f7fc] to-[#f8f9fb] px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">ContractorOS</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Unified contractor lifecycle platform
          </p>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}
