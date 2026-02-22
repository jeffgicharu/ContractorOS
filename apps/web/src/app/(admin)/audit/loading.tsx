import { SkeletonLine, SkeletonTable } from '@/components/ui/skeleton';

export default function AuditLoading() {
  return (
    <div>
      <SkeletonLine width="120px" height="30px" />
      <SkeletonLine width="300px" height="14px" className="mt-2" />
      <div className="mt-6">
        <SkeletonLine width="100%" height="56px" />
      </div>
      <div className="mt-6">
        <SkeletonTable rows={10} cols={6} />
      </div>
    </div>
  );
}
