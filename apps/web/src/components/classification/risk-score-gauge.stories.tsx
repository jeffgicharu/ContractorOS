import type { Meta, StoryObj } from '@storybook/react';
import { RiskScoreGauge } from './risk-score-gauge';
import { RiskLevel } from '@contractor-os/shared';

const meta: Meta<typeof RiskScoreGauge> = {
  title: 'Classification/RiskScoreGauge',
  component: RiskScoreGauge,
};

export default meta;
type Story = StoryObj<typeof RiskScoreGauge>;

export const Low: Story = { args: { score: 15.2, riskLevel: RiskLevel.LOW } };
export const Medium: Story = { args: { score: 38.5, riskLevel: RiskLevel.MEDIUM } };
export const High: Story = { args: { score: 62.8, riskLevel: RiskLevel.HIGH } };
export const Critical: Story = { args: { score: 88.3, riskLevel: RiskLevel.CRITICAL } };
export const SmallSize: Story = { args: { score: 45.0, riskLevel: RiskLevel.MEDIUM, size: 120 } };

export const AllLevels: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <RiskScoreGauge score={15.2} riskLevel={RiskLevel.LOW} />
      <RiskScoreGauge score={38.5} riskLevel={RiskLevel.MEDIUM} />
      <RiskScoreGauge score={62.8} riskLevel={RiskLevel.HIGH} />
      <RiskScoreGauge score={88.3} riskLevel={RiskLevel.CRITICAL} />
    </div>
  ),
};
