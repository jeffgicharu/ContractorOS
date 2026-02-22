import { SkeletonLine, SkeletonTable } from '@/components/ui/skeleton';

export default function DocumentsLoading() {
  return (
    <div>
      <SkeletonLine width="180px" height="30px" />
      <SkeletonLine width="300px" height="14px" className="mt-2" />
      <div className="mt-6">
        <SkeletonTable rows={8} cols={6} />
      </div>
    </div>
  );
}
