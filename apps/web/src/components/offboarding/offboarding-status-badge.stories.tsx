import type { Meta, StoryObj } from '@storybook/react';
import { OffboardingStatusBadge } from './offboarding-status-badge';
import { OffboardingStatus } from '@contractor-os/shared';

const meta: Meta<typeof OffboardingStatusBadge> = {
  title: 'Offboarding/OffboardingStatusBadge',
  component: OffboardingStatusBadge,
};

export default meta;
type Story = StoryObj<typeof OffboardingStatusBadge>;

export const Initiated: Story = { args: { status: OffboardingStatus.INITIATED } };
export const InProgress: Story = { args: { status: OffboardingStatus.IN_PROGRESS } };
export const Completed: Story = { args: { status: OffboardingStatus.COMPLETED } };
export const Cancelled: Story = { args: { status: OffboardingStatus.CANCELLED } };
export const PillVariant: Story = { args: { status: OffboardingStatus.IN_PROGRESS, variant: 'pill' } };

export const AllStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      {Object.values(OffboardingStatus).map((s) => (
        <OffboardingStatusBadge key={s} status={s} variant="pill" />
      ))}
    </div>
  ),
};
