import type { Meta, StoryObj } from '@storybook/react';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { InvoiceStatus } from '@contractor-os/shared';

const meta: Meta<typeof InvoiceStatusBadge> = {
  title: 'Invoices/InvoiceStatusBadge',
  component: InvoiceStatusBadge,
};

export default meta;
type Story = StoryObj<typeof InvoiceStatusBadge>;

export const Draft: Story = { args: { status: InvoiceStatus.DRAFT } };
export const Submitted: Story = { args: { status: InvoiceStatus.SUBMITTED } };
export const Approved: Story = { args: { status: InvoiceStatus.APPROVED } };
export const Paid: Story = { args: { status: InvoiceStatus.PAID } };
export const Rejected: Story = { args: { status: InvoiceStatus.REJECTED } };

export const AllStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      {Object.values(InvoiceStatus).map((s) => (
        <InvoiceStatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};
