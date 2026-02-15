const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return dateFormatter.format(new Date(dateStr));
}

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}
