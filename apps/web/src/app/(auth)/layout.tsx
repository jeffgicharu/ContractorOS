import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">ContractorOS</h1>
          <p className="mt-1 text-sm text-slate-500">
            Unified contractor lifecycle platform
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
