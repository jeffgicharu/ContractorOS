import { SkeletonLine, SkeletonTable } from '@/components/ui/skeleton';

export default function PortalLoading() {
  return (
    <div>
      <SkeletonLine width="200px" height="30px" />
      <SkeletonLine width="280px" height="14px" className="mt-2" />
      <div className="mt-6">
        <SkeletonTable rows={6} cols={4} />
      </div>
    </div>
  );
}
