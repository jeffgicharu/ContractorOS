import type { Meta, StoryObj } from '@storybook/react';
import { ProgressTracker } from './progress-tracker';
import { OffboardingStatus } from '@contractor-os/shared';

const meta: Meta<typeof ProgressTracker> = {
  title: 'Offboarding/ProgressTracker',
  component: ProgressTracker,
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ProgressTracker>;

export const Initiated: Story = { args: { currentStatus: OffboardingStatus.INITIATED } };
export const InProgress: Story = { args: { currentStatus: OffboardingStatus.IN_PROGRESS } };
export const PendingInvoice: Story = { args: { currentStatus: OffboardingStatus.PENDING_FINAL_INVOICE } };
export const Completed: Story = { args: { currentStatus: OffboardingStatus.COMPLETED } };
export const Cancelled: Story = { args: { currentStatus: OffboardingStatus.CANCELLED } };
