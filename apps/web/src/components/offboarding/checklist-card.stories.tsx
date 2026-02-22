import type { Meta, StoryObj } from '@storybook/react';
import { ChecklistCard } from './checklist-card';
import { ChecklistStatus } from '@contractor-os/shared';
import type { OffboardingChecklistItem } from '@contractor-os/shared';

const meta: Meta<typeof ChecklistCard> = {
  title: 'Offboarding/ChecklistCard',
  component: ChecklistCard,
  decorators: [(Story) => <div className="max-w-md"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ChecklistCard>;

const makeItem = (
  id: string,
  itemType: string,
  status: string,
): OffboardingChecklistItem => ({
  id,
  workflowId: 'wf-1',
  itemType: itemType as OffboardingChecklistItem['itemType'],
  status: status as OffboardingChecklistItem['status'],
  completedBy: status === ChecklistStatus.COMPLETED ? 'user-1' : null,
  completedAt: status === ChecklistStatus.COMPLETED ? '2025-06-15T10:00:00Z' : null,
  notes: null,
  createdAt: '2025-06-01T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z',
});

const sampleItems: OffboardingChecklistItem[] = [
  makeItem('1', 'revoke_system_access', ChecklistStatus.COMPLETED),
  makeItem('2', 'revoke_code_repo_access', ChecklistStatus.COMPLETED),
  makeItem('3', 'revoke_communication_tools', ChecklistStatus.PENDING),
  makeItem('4', 'retrieve_equipment', ChecklistStatus.PENDING),
  makeItem('5', 'process_final_invoice', ChecklistStatus.PENDING),
  makeItem('6', 'archive_documents', ChecklistStatus.PENDING),
  makeItem('7', 'freeze_tax_data', ChecklistStatus.NOT_APPLICABLE),
  makeItem('8', 'exit_interview', ChecklistStatus.PENDING),
  makeItem('9', 'remove_from_tools', ChecklistStatus.PENDING),
];

export const PartiallyCompleted: Story = {
  args: {
    workflowId: 'wf-1',
    items: sampleItems,
    isEditable: true,
    onUpdated: () => {},
  },
};

export const AllCompleted: Story = {
  args: {
    workflowId: 'wf-1',
    items: sampleItems.map((item) =>
      item.status !== ChecklistStatus.NOT_APPLICABLE
        ? { ...item, status: ChecklistStatus.COMPLETED as OffboardingChecklistItem['status'] }
        : item,
    ),
    isEditable: false,
    onUpdated: () => {},
  },
};

export const ReadOnly: Story = {
  args: {
    workflowId: 'wf-1',
    items: sampleItems,
    isEditable: false,
    onUpdated: () => {},
  },
};
