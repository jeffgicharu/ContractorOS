import type { Meta, StoryObj } from '@storybook/react';
import {
  MobileCard,
  MobileCardList,
  MobileCardRow,
  TableScroll,
} from './responsive-table';

const meta: Meta<typeof MobileCard> = {
  title: 'UI/ResponsiveTable',
  component: MobileCard,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export default meta;
type Story = StoryObj<typeof MobileCard>;

const Badge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center rounded-md bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">
    {label}
  </span>
);

export const CardStack: Story = {
  render: () => (
    <div className="max-w-[375px] bg-slate-50 p-4">
      <MobileCardList>
        <MobileCard
          href="#"
          title="John Smith"
          accessory={<Badge label="Active" />}
        >
          <MobileCardRow label="Email">john.smith@example.com</MobileCardRow>
          <MobileCardRow label="Type">Foreign contractor</MobileCardRow>
          <MobileCardRow label="Created">May 30, 2025</MobileCardRow>
        </MobileCard>
        <MobileCard
          href="#"
          title="Elizabeth Martinez"
          accessory={<Badge label="Active" />}
        >
          <MobileCardRow label="Email">e.martinez@example.com</MobileCardRow>
          <MobileCardRow label="Type">Domestic contractor</MobileCardRow>
          <MobileCardRow label="Created">Jun 17, 2025</MobileCardRow>
        </MobileCard>
      </MobileCardList>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="max-w-[375px] bg-slate-50 p-4">
      <MobileCardList>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No contractors match your filters
        </div>
      </MobileCardList>
    </div>
  ),
};

export const HorizontalScroll: Story = {
  render: () => (
    <div className="max-w-[375px] p-4">
      <TableScroll className="rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase text-slate-400">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs uppercase text-slate-400">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs uppercase text-slate-400">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right text-xs uppercase text-slate-400">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 text-[13px] text-slate-700">
                Architecture and technical design
              </td>
              <td className="px-4 py-3 text-right text-[13px] text-slate-700">
                1
              </td>
              <td className="px-4 py-3 text-right text-[13px] text-slate-700">
                $26,800.00
              </td>
              <td className="px-4 py-3 text-right text-[13px] text-slate-700">
                $26,800.00
              </td>
            </tr>
          </tbody>
        </table>
      </TableScroll>
    </div>
  ),
};
