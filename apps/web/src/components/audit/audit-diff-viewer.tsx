'use client';

interface AuditDiffViewerProps {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

export function AuditDiffViewer({ oldValues, newValues }: AuditDiffViewerProps) {
  if (!oldValues && !newValues) {
    return (
      <p className="text-xs text-slate-400">No change data recorded.</p>
    );
  }

  // Collect all keys from both objects
  const allKeys = new Set<string>([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]);

  // Filter to only keys that actually changed
  const changedKeys = [...allKeys].filter((key) => {
    const oldVal = oldValues?.[key];
    const newVal = newValues?.[key];
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  });

  if (changedKeys.length === 0 && oldValues) {
    return (
      <p className="text-xs text-slate-400">No fields changed.</p>
    );
  }

  // If we only have new values (no old), show them as-is
  if (!oldValues) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">New Values</p>
        <div className="space-y-1">
          {Object.entries(newValues ?? {}).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="min-w-[140px] font-medium text-slate-600">{key}</span>
              <span className="font-mono text-green-700">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-100">
            <th className="px-3 py-2 text-left font-semibold text-slate-500">Field</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-500">Before</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-500">After</th>
          </tr>
        </thead>
        <tbody>
          {changedKeys.map((key) => (
            <tr key={key} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-1.5 font-medium text-slate-600">{key}</td>
              <td className="px-3 py-1.5 font-mono text-red-600">
                {formatValue(oldValues?.[key])}
              </td>
              <td className="px-3 py-1.5 font-mono text-green-700">
                {formatValue(newValues?.[key])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
