import type { Meta, StoryObj } from '@storybook/react';
import { InvoiceTimeline } from './invoice-timeline';
import { InvoiceStatus } from '@contractor-os/shared';

const meta: Meta<typeof InvoiceTimeline> = {
  title: 'Invoices/InvoiceTimeline',
  component: InvoiceTimeline,
  decorators: [(Story) => <div className="max-w-sm"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof InvoiceTimeline>;

export const FullLifecycle: Story = {
  args: {
    history: [
      {
        id: '1',
        invoiceId: 'inv-1',
        fromStatus: null,
        toStatus: InvoiceStatus.DRAFT,
        changedBy: 'user-1',
        reason: null,
        createdAt: '2025-06-01T10:00:00Z',
      },
      {
        id: '2',
        invoiceId: 'inv-1',
        fromStatus: InvoiceStatus.DRAFT,
        toStatus: InvoiceStatus.SUBMITTED,
        changedBy: 'user-1',
        reason: null,
        createdAt: '2025-06-02T14:30:00Z',
      },
      {
        id: '3',
        invoiceId: 'inv-1',
        fromStatus: InvoiceStatus.SUBMITTED,
        toStatus: InvoiceStatus.APPROVED,
        changedBy: 'user-2',
        reason: 'Looks good',
        createdAt: '2025-06-03T09:00:00Z',
      },
      {
        id: '4',
        invoiceId: 'inv-1',
        fromStatus: InvoiceStatus.APPROVED,
        toStatus: InvoiceStatus.PAID,
        changedBy: 'user-2',
        reason: null,
        createdAt: '2025-06-10T16:00:00Z',
      },
    ],
  },
};

export const Rejected: Story = {
  args: {
    history: [
      {
        id: '1',
        invoiceId: 'inv-2',
        fromStatus: null,
        toStatus: InvoiceStatus.DRAFT,
        changedBy: 'user-1',
        reason: null,
        createdAt: '2025-06-01T10:00:00Z',
      },
      {
        id: '2',
        invoiceId: 'inv-2',
        fromStatus: InvoiceStatus.DRAFT,
        toStatus: InvoiceStatus.SUBMITTED,
        changedBy: 'user-1',
        reason: null,
        createdAt: '2025-06-02T14:30:00Z',
      },
      {
        id: '3',
        invoiceId: 'inv-2',
        fromStatus: InvoiceStatus.SUBMITTED,
        toStatus: InvoiceStatus.REJECTED,
        changedBy: 'user-2',
        reason: 'Missing line item details',
        createdAt: '2025-06-03T11:00:00Z',
      },
    ],
  },
};

export const Empty: Story = {
  args: { history: [] },
};
