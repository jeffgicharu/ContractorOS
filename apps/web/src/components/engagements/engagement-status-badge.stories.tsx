import type { Meta, StoryObj } from '@storybook/react';
import { EngagementStatusBadge } from './engagement-status-badge';
import { EngagementStatus } from '@contractor-os/shared';

const meta: Meta<typeof EngagementStatusBadge> = {
  title: 'Engagements/EngagementStatusBadge',
  component: EngagementStatusBadge,
};

export default meta;
type Story = StoryObj<typeof EngagementStatusBadge>;

export const Draft: Story = { args: { status: EngagementStatus.DRAFT } };
export const Active: Story = { args: { status: EngagementStatus.ACTIVE } };
export const Paused: Story = { args: { status: EngagementStatus.PAUSED } };
export const Completed: Story = { args: { status: EngagementStatus.COMPLETED } };
export const Cancelled: Story = { args: { status: EngagementStatus.CANCELLED } };

export const AllStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      {Object.values(EngagementStatus).map((s) => (
        <EngagementStatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};
