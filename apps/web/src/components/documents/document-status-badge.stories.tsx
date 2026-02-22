import type { Meta, StoryObj } from '@storybook/react';
import { DocumentStatusBadge } from './document-status-badge';

const meta: Meta<typeof DocumentStatusBadge> = {
  title: 'Documents/DocumentStatusBadge',
  component: DocumentStatusBadge,
};

export default meta;
type Story = StoryObj<typeof DocumentStatusBadge>;

export const Current: Story = { args: { status: 'current' } };
export const Expired: Story = { args: { status: 'expired' } };
export const Expiring: Story = { args: { status: 'expiring' } };
export const Archived: Story = { args: { status: 'archived' } };
export const Missing: Story = { args: { status: 'missing' } };

export const AllStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['current', 'expired', 'expiring', 'archived', 'missing'] as const).map((s) => (
        <DocumentStatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};
