'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Mobile-only card-stack rendering for entity-list tables.
 *
 * Tables across the app drop columns below the `sm` breakpoint via
 * `hidden sm:table-cell`, which leaves only two columns visible and no way to
 * reach the rest on a phone. The pattern here is: keep the existing `<table>`
 * for `sm` and up, and render the same rows as stacked cards below `sm`.
 *
 * `<MobileCardList>` is the `sm:hidden` container; the desktop table wrapper
 * should be marked `hidden sm:block` so exactly one of the two renders.
 */
export function MobileCardList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 sm:hidden ${className ?? ''}`}>{children}</div>
  );
}

/**
 * A single row rendered as a card. `title` is the most important field
 * (e.g. contractor name, invoice number); `accessory` sits opposite the
 * title and is typically a status badge. Remaining fields go in `children`
 * as `<MobileCardRow>` label/value pairs.
 */
export function MobileCard({
  href,
  onClick,
  title,
  subtitle,
  accessory,
  children,
}: {
  href?: string;
  onClick?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  accessory?: ReactNode;
  children?: ReactNode;
}) {
  const inner = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-slate-900">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-[13px] text-slate-500">
              {subtitle}
            </div>
          ) : null}
        </div>
        {accessory ? <div className="shrink-0">{accessory}</div> : null}
      </div>
      {children ? <dl className="mt-3 space-y-1.5">{children}</dl> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}

/** Label/value line inside a `<MobileCard>`. */
export function MobileCardRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
        {label}
      </dt>
      <dd
        className="text-right text-[13px] text-slate-700"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * Horizontal-scroll wrapper with a right-edge fade affordance on small
 * screens, signalling that the table scrolls sideways. Used for dense
 * data tables (e.g. invoice line items) where every column carries
 * roughly equal weight and a card-stack would read worse than a table.
 */
export function TableScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="overflow-x-auto">{children}</div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent sm:hidden"
      />
    </div>
  );
}
