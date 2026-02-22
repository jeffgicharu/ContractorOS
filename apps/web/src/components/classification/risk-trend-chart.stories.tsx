import type { Meta, StoryObj } from '@storybook/react';
import { RiskTrendChart } from './risk-trend-chart';
import { RiskLevel } from '@contractor-os/shared';
import type { ClassificationAssessment } from '@contractor-os/shared';

const meta: Meta<typeof RiskTrendChart> = {
  title: 'Classification/RiskTrendChart',
  component: RiskTrendChart,
  decorators: [(Story) => <div className="max-w-2xl"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof RiskTrendChart>;

const makeAssessment = (
  id: string,
  score: number,
  risk: string,
  date: string,
): ClassificationAssessment =>
  ({
    id,
    contractorId: 'c-1',
    organizationId: 'org-1',
    assessedAt: date,
    overallRisk: risk,
    overallScore: score,
    irsScore: score * 0.4,
    dolScore: score * 0.3,
    abcScore: score * 0.3,
    irsFactors: {} as ClassificationAssessment['irsFactors'],
    dolFactors: {} as ClassificationAssessment['dolFactors'],
    abcFactors: {} as ClassificationAssessment['abcFactors'],
    inputData: {} as ClassificationAssessment['inputData'],
    createdAt: date,
  }) as ClassificationAssessment;

export const MultipleAssessments: Story = {
  args: {
    assessments: [
      makeAssessment('1', 22, RiskLevel.LOW, '2025-01-15T00:00:00Z'),
      makeAssessment('2', 35, RiskLevel.MEDIUM, '2025-02-15T00:00:00Z'),
      makeAssessment('3', 48, RiskLevel.MEDIUM, '2025-03-15T00:00:00Z'),
      makeAssessment('4', 62, RiskLevel.HIGH, '2025-04-15T00:00:00Z'),
      makeAssessment('5', 55, RiskLevel.HIGH, '2025-05-15T00:00:00Z'),
      makeAssessment('6', 41, RiskLevel.MEDIUM, '2025-06-15T00:00:00Z'),
    ],
  },
};

export const SingleAssessment: Story = {
  args: {
    assessments: [makeAssessment('1', 45, RiskLevel.MEDIUM, '2025-06-15T00:00:00Z')],
  },
};

export const Empty: Story = {
  args: { assessments: [] },
};
