'use client';

interface Filters {
  entityType: string;
  userId: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}

interface AuditFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const ENTITY_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Contractors', value: 'contractors' },
  { label: 'Invoices', value: 'invoices' },
  { label: 'Engagements', value: 'engagements' },
  { label: 'Time Entries', value: 'time-entries' },
  { label: 'Documents', value: 'documents' },
  { label: 'Offboarding', value: 'offboarding' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Classification', value: 'classification' },
];

export function AuditFilters({ filters, onChange }: AuditFiltersProps) {
  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  function handleClear() {
    onChange({
      entityType: '',
      userId: '',
      action: '',
      dateFrom: '',
      dateTo: '',
    });
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Entity Type</label>
        <select
          value={filters.entityType}
          onChange={(e) => update('entityType', e.target.value)}
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700"
        >
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Action</label>
        <input
          type="text"
          value={filters.action}
          onChange={(e) => update('action', e.target.value)}
          placeholder="e.g. create, approve"
          className="h-9 w-36 rounded-md border border-slate-300 px-2 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Date From</label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update('dateFrom', e.target.value)}
          className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-700"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Date To</label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update('dateTo', e.target.value)}
          className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-700"
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="h-9 rounded-md px-3 text-sm text-slate-500 hover:text-slate-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}
