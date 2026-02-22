'use client';

import { useState } from 'react';
import type { OffboardingChecklistItem } from '@contractor-os/shared';
import { ChecklistStatus } from '@contractor-os/shared';
import { api } from '@/lib/api-client';

const ITEM_TYPE_LABELS: Record<string, string> = {
  revoke_system_access: 'Revoke System Access',
  revoke_code_repo_access: 'Revoke Code Repository Access',
  revoke_communication_tools: 'Revoke Communication Tools',
  retrieve_equipment: 'Retrieve Equipment',
  process_final_invoice: 'Process Final Invoice',
  archive_documents: 'Archive Documents',
  freeze_tax_data: 'Freeze Tax Data',
  exit_interview: 'Exit Interview',
  remove_from_tools: 'Remove from Tools',
};

const STATUS_ICON: Record<string, { icon: string; className: string }> = {
  [ChecklistStatus.COMPLETED]: { icon: '✓', className: 'bg-success-500 text-white' },
  [ChecklistStatus.PENDING]: { icon: '', className: 'border-2 border-slate-300' },
  [ChecklistStatus.SKIPPED]: { icon: '—', className: 'bg-slate-300 text-white' },
  [ChecklistStatus.NOT_APPLICABLE]: { icon: '—', className: 'bg-slate-200 text-slate-400' },
};

interface ChecklistCardProps {
  workflowId: string;
  items: OffboardingChecklistItem[];
  isEditable: boolean;
  onUpdated: () => void;
}

export function ChecklistCard({ workflowId, items, isEditable, onUpdated }: ChecklistCardProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const applicableItems = items.filter((i) => i.status !== ChecklistStatus.NOT_APPLICABLE);
  const completedCount = items.filter((i) => i.status === ChecklistStatus.COMPLETED).length;
  const progress = applicableItems.length > 0
    ? Math.round((completedCount / applicableItems.length) * 100)
    : 0;

  async function toggleItem(item: OffboardingChecklistItem) {
    if (!isEditable || item.status === ChecklistStatus.NOT_APPLICABLE) return;

    const newStatus = item.status === ChecklistStatus.COMPLETED
      ? ChecklistStatus.PENDING
      : ChecklistStatus.COMPLETED;

    setUpdating(item.id);
    try {
      await api.patch(`/offboarding/${workflowId}/checklist/${item.id}`, {
        status: newStatus,
      });
      onUpdated();
    } catch {
      // Error handled silently, UI will refresh
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Checklist</h3>
        <span className="text-sm text-slate-500">
          {completedCount}/{applicableItems.length} completed ({progress}%)
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-brand-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const iconConfig = STATUS_ICON[item.status] ?? STATUS_ICON[ChecklistStatus.PENDING]!;
          const isNotApplicable = item.status === ChecklistStatus.NOT_APPLICABLE;
          const isUpdatingThis = updating === item.id;

          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] ${
                isNotApplicable
                  ? 'opacity-50'
                  : isEditable
                    ? 'cursor-pointer hover:bg-slate-50'
                    : ''
              }`}
              onClick={() => !isNotApplicable && toggleItem(item)}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold ${iconConfig.className} ${
                  isUpdatingThis ? 'animate-pulse' : ''
                }`}
              >
                {iconConfig.icon}
              </span>
              <span
                className={`flex-1 ${
                  item.status === ChecklistStatus.COMPLETED
                    ? 'text-slate-500 line-through'
                    : isNotApplicable
                      ? 'text-slate-400 italic'
                      : 'text-slate-700'
                }`}
              >
                {ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
                {isNotApplicable && ' (N/A)'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
