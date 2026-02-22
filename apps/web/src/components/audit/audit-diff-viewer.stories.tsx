import type { Meta, StoryObj } from '@storybook/react';
import { AuditDiffViewer } from './audit-diff-viewer';

const meta: Meta<typeof AuditDiffViewer> = {
  title: 'Audit/AuditDiffViewer',
  component: AuditDiffViewer,
};

export default meta;
type Story = StoryObj<typeof AuditDiffViewer>;

export const WithChanges: Story = {
  args: {
    oldValues: { status: 'draft', notes: 'Initial submission' },
    newValues: { status: 'submitted', notes: 'Updated for review' },
  },
};

export const NewValuesOnly: Story = {
  args: {
    oldValues: null,
    newValues: { status: 'submitted', invoiceNumber: 'INV-2025-001' },
  },
};

export const NoData: Story = {
  args: {
    oldValues: null,
    newValues: null,
  },
};

export const NoChanges: Story = {
  args: {
    oldValues: { status: 'active' },
    newValues: { status: 'active' },
  },
};
