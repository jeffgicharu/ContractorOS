import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <p className="text-6xl font-bold text-slate-200">404</p>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Page not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
