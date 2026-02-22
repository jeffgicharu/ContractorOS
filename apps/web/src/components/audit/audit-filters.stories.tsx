import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AuditFilters } from './audit-filters';

const meta: Meta<typeof AuditFilters> = {
  title: 'Audit/AuditFilters',
  component: AuditFilters,
};

export default meta;

export const Default: StoryObj = {
  render: () => {
    const [filters, setFilters] = useState({
      entityType: '',
      userId: '',
      action: '',
      dateFrom: '',
      dateTo: '',
    });
    return <AuditFilters filters={filters} onChange={setFilters} />;
  },
};

export const WithFiltersApplied: StoryObj = {
  render: () => {
    const [filters, setFilters] = useState({
      entityType: 'invoices',
      userId: '',
      action: 'approve',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
    });
    return <AuditFilters filters={filters} onChange={setFilters} />;
  },
};
