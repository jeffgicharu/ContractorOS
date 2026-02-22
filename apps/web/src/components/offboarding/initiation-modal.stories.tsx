import type { Meta, StoryObj } from '@storybook/react';
import { InitiationModal } from './initiation-modal';

const meta: Meta<typeof InitiationModal> = {
  title: 'Offboarding/InitiationModal',
  component: InitiationModal,
};

export default meta;
type Story = StoryObj<typeof InitiationModal>;

export const Default: Story = {
  args: {
    contractorName: 'Jane Smith',
    onConfirm: async (data) => {
      await new Promise((r) => setTimeout(r, 1000));
      alert(`Offboarding initiated: ${JSON.stringify(data)}`);
    },
    onClose: () => {},
  },
};
