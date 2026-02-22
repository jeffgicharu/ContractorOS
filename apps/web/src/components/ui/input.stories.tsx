import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: 'Enter text...' } };
export const WithLabel: Story = { args: { label: 'Email', placeholder: 'name@example.com' } };
export const WithError: Story = { args: { label: 'Email', value: 'invalid', error: 'Invalid email address' } };
export const Disabled: Story = { args: { label: 'Disabled', value: 'Cannot edit', disabled: true } };
