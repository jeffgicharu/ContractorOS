import type { Meta, StoryObj } from '@storybook/react';
import { KanbanCard } from './kanban-card';
import { ContractorStatus, ContractorType } from '@contractor-os/shared';

const meta: Meta<typeof KanbanCard> = {
  title: 'Onboarding/KanbanCard',
  component: KanbanCard,
  decorators: [(Story) => <div className="w-64"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof KanbanCard>;

const baseContractor = {
  id: '00000000-0000-0000-0000-000000000001',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  status: ContractorStatus.ONBOARDING,
  type: ContractorType.INDIVIDUAL,
  activatedAt: null,
  createdAt: new Date().toISOString(),
};

export const Default: Story = {
  args: { contractor: baseContractor },
};

export const NewToday: Story = {
  args: {
    contractor: {
      ...baseContractor,
      createdAt: new Date().toISOString(),
    },
  },
};

export const InStageMultipleDays: Story = {
  args: {
    contractor: {
      ...baseContractor,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
};
