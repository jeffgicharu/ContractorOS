import { OffboardingStatus } from '@contractor-os/shared';

const STEPS = [
  { status: OffboardingStatus.INITIATED, label: 'Initiated' },
  { status: OffboardingStatus.IN_PROGRESS, label: 'In Progress' },
  { status: OffboardingStatus.PENDING_FINAL_INVOICE, label: 'Pending Invoice' },
  { status: OffboardingStatus.COMPLETED, label: 'Completed' },
] as const;

const STATUS_ORDER: Record<OffboardingStatus, number> = {
  [OffboardingStatus.INITIATED]: 0,
  [OffboardingStatus.IN_PROGRESS]: 1,
  [OffboardingStatus.PENDING_FINAL_INVOICE]: 2,
  [OffboardingStatus.COMPLETED]: 3,
  [OffboardingStatus.CANCELLED]: -1,
};

interface ProgressTrackerProps {
  currentStatus: OffboardingStatus;
}

export function ProgressTracker({ currentStatus }: ProgressTrackerProps) {
  if (currentStatus === OffboardingStatus.CANCELLED) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-slate-100 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-slate-400" />
        <span className="text-sm font-medium text-slate-600">Workflow Cancelled</span>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER[currentStatus];

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.status} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isCompleted
                    ? 'bg-success-500 text-white'
                    : isCurrent
                      ? 'bg-brand-500 text-white'
                      : 'border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-medium ${
                  isCurrent ? 'text-brand-600' : isCompleted ? 'text-success-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  i < currentIndex ? 'bg-success-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
