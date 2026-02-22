import { SkeletonLine, SkeletonTable } from '@/components/ui/skeleton';

export default function InvoicesLoading() {
  return (
    <div>
      <SkeletonLine width="120px" height="30px" />
      <SkeletonLine width="260px" height="14px" className="mt-2" />
      <div className="mt-6 flex gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} width="80px" height="14px" />
        ))}
      </div>
      <div className="mt-6">
        <SkeletonTable rows={8} cols={7} />
      </div>
    </div>
  );
}
