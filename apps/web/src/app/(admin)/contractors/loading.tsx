import { SkeletonLine, SkeletonTable } from '@/components/ui/skeleton';

export default function ContractorsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <SkeletonLine width="160px" height="30px" />
          <SkeletonLine width="280px" height="14px" className="mt-2" />
        </div>
        <SkeletonLine width="140px" height="36px" />
      </div>
      <div className="mt-6">
        <SkeletonLine width="100%" height="40px" />
      </div>
      <div className="mt-4">
        <SkeletonTable rows={10} cols={6} />
      </div>
    </div>
  );
}
