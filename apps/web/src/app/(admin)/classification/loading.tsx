import { SkeletonLine, SkeletonCard } from '@/components/ui/skeleton';

export default function ClassificationLoading() {
  return (
    <div>
      <SkeletonLine width="240px" height="30px" />
      <SkeletonLine width="340px" height="14px" className="mt-2" />
      <div className="mt-6 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="mt-6">
        <SkeletonLine width="100%" height="160px" />
      </div>
    </div>
  );
}
