import type { ReactNode } from 'react';

interface KanbanColumnProps {
  title: string;
  color: string;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ title, color, count, children }: KanbanColumnProps) {
  return (
    <div className="flex w-full shrink-0 sm:w-[260px] lg:w-auto lg:flex-1 flex-col rounded-lg bg-white border border-slate-200 overflow-hidden">
      <div
        className="border-b border-slate-200 px-3 py-3"
        style={{ borderTopWidth: '3px', borderTopColor: color, borderTopStyle: 'solid' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-slate-700">{title}</h3>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-medium text-slate-600">
            {count}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2 p-2 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}
