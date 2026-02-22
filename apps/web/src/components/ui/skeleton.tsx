interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonLine({ width = '100%', height = '16px', className = '' }: SkeletonLineProps) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-6 ${className}`}>
      <SkeletonLine width="60%" height="20px" />
      <SkeletonLine width="40%" height="14px" className="mt-3" />
      <SkeletonLine width="80%" height="14px" className="mt-2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonLine key={i} width={`${100 / cols}%`} height="12px" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="border-b border-slate-100 px-4 py-3 last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <SkeletonLine key={colIdx} width={`${100 / cols}%`} height="14px" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
