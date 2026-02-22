import type { Meta, StoryObj } from '@storybook/react';
import { RiskSummaryCard } from './risk-summary-card';
import { RiskLevel } from '@contractor-os/shared';

const meta: Meta<typeof RiskSummaryCard> = {
  title: 'Classification/RiskSummaryCard',
  component: RiskSummaryCard,
  decorators: [(Story) => <div className="max-w-sm"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof RiskSummaryCard>;

export const LowRisk: Story = {
  args: {
    contractorId: '00000000-0000-0000-0000-000000000001',
    contractorName: 'Jane Smith',
    overallRisk: RiskLevel.LOW,
    overallScore: 18.5,
    assessedAt: '2025-06-15T10:00:00Z',
  },
};

export const HighRisk: Story = {
  args: {
    contractorId: '00000000-0000-0000-0000-000000000002',
    contractorName: 'John Doe',
    overallRisk: RiskLevel.HIGH,
    overallScore: 68.2,
    assessedAt: '2025-06-10T14:00:00Z',
  },
};

export const CriticalRisk: Story = {
  args: {
    contractorId: '00000000-0000-0000-0000-000000000003',
    contractorName: 'Alice Johnson',
    overallRisk: RiskLevel.CRITICAL,
    overallScore: 91.0,
    assessedAt: '2025-06-01T08:00:00Z',
  },
};
