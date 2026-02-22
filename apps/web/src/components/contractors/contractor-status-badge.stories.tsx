import type { Meta, StoryObj } from '@storybook/react';
import { ContractorStatusBadge } from './contractor-status-badge';
import { ContractorStatus } from '@contractor-os/shared';

const meta: Meta<typeof ContractorStatusBadge> = {
  title: 'Contractors/ContractorStatusBadge',
  component: ContractorStatusBadge,
};

export default meta;
type Story = StoryObj<typeof ContractorStatusBadge>;

export const Active: Story = { args: { status: ContractorStatus.ACTIVE } };
export const InviteSent: Story = { args: { status: ContractorStatus.INVITE_SENT } };
export const Suspended: Story = { args: { status: ContractorStatus.SUSPENDED } };
export const Offboarded: Story = { args: { status: ContractorStatus.OFFBOARDED } };
export const PillVariant: Story = { args: { status: ContractorStatus.ACTIVE, variant: 'pill' } };

export const AllStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      {Object.values(ContractorStatus).map((s) => (
        <ContractorStatusBadge key={s} status={s} variant="pill" />
      ))}
    </div>
  ),
};
