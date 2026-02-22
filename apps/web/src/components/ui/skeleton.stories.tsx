import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonLine, SkeletonCard, SkeletonTable } from './skeleton';

const meta: Meta = {
  title: 'UI/Skeleton',
};

export default meta;

export const Line: StoryObj = {
  render: () => (
    <div className="w-80 space-y-2">
      <SkeletonLine width="100%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="60%" />
    </div>
  ),
};

export const Card: StoryObj = {
  render: () => <SkeletonCard className="w-80" />,
};

export const Table: StoryObj = {
  render: () => (
    <div className="w-[600px]">
      <SkeletonTable rows={5} cols={4} />
    </div>
  ),
};
