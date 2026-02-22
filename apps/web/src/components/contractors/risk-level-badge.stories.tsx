import type { Meta, StoryObj } from '@storybook/react';
import { RiskLevelBadge } from './risk-level-badge';
import { RiskLevel } from '@contractor-os/shared';

const meta: Meta<typeof RiskLevelBadge> = {
  title: 'Contractors/RiskLevelBadge',
  component: RiskLevelBadge,
};

export default meta;
type Story = StoryObj<typeof RiskLevelBadge>;

export const Low: Story = { args: { level: RiskLevel.LOW } };
export const Medium: Story = { args: { level: RiskLevel.MEDIUM, score: 45 } };
export const High: Story = { args: { level: RiskLevel.HIGH, score: 72 } };
export const Critical: Story = { args: { level: RiskLevel.CRITICAL, score: 88 } };

export const AllLevels: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      <RiskLevelBadge level={RiskLevel.LOW} score={18} />
      <RiskLevelBadge level={RiskLevel.MEDIUM} score={42} />
      <RiskLevelBadge level={RiskLevel.HIGH} score={68} />
      <RiskLevelBadge level={RiskLevel.CRITICAL} score={91} />
    </div>
  ),
};
