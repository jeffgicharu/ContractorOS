import { SkeletonLine, SkeletonTable } from '@/components/ui/skeleton';

export default function OffboardingLoading() {
  return (
    <div>
      <SkeletonLine width="220px" height="30px" />
      <SkeletonLine width="340px" height="14px" className="mt-2" />
      <div className="mt-6 flex gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} width="80px" height="14px" />
        ))}
      </div>
      <div className="mt-6">
        <SkeletonTable rows={6} cols={6} />
      </div>
    </div>
  );
}
