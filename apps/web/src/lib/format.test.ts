import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency } from './format';

describe('formatDate', () => {
  it('returns the em-dash placeholder for null input', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats an ISO date as "Mon D, YYYY"', () => {
    expect(formatDate('2026-04-15T00:00:00.000Z')).toMatch(/Apr 1[45], 2026/);
  });

  it('round-trips a date-only string', () => {
    expect(formatDate('2026-12-31T12:00:00.000Z')).toMatch(/Dec 31, 2026/);
  });
});

describe('formatCurrency', () => {
  it('formats a positive amount as USD with two decimals', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('formats zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats a negative amount with a leading minus', () => {
    expect(formatCurrency(-99.99)).toBe('-$99.99');
  });
});
