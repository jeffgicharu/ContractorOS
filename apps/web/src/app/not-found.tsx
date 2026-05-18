import Link from 'next/link';

export default function NotFound() {
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
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
          <p className="text-6xl font-bold text-slate-200">404</p>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Page not found</h2>
          <p className="mt-2 text-sm text-slate-500">
            The page you are looking for doesn&apos;t exist or may have been moved.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
