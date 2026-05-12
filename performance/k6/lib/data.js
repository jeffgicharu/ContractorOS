import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './auth.js';

/**
 * Load a sample of real ids from the seeded perf DB. Called once from
 * setup() — the result is shared across VUs so each iteration can pick a
 * different (org, contractor, invoice) tuple instead of hammering the
 * same row.
 */
export function loadSeedSample(authHeader) {
  const contractorsRes = http.get(`${BASE_URL}/contractors?pageSize=100`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'contractors-list' },
  });
  check(contractorsRes, { 'sample contractors 200': (r) => r.status === 200 });

  const invoicesRes = http.get(`${BASE_URL}/invoices?pageSize=100`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'invoices-list' },
  });
  check(invoicesRes, { 'sample invoices 200': (r) => r.status === 200 });

  const contractors = (contractorsRes.json('data') || []).map((c) => c.id);
  const invoices = (invoicesRes.json('data') || []).map((i) => ({
    id: i.id,
    status: i.status,
  }));
  const draftInvoices = invoices.filter((i) => i.status === 'draft').map((i) => i.id);
  const submittedInvoices = invoices.filter((i) => i.status === 'submitted').map((i) => i.id);

  return {
    contractorIds: contractors,
    invoiceIds: invoices.map((i) => i.id),
    draftInvoiceIds: draftInvoices,
    submittedInvoiceIds: submittedInvoices,
  };
}

export function randomItem(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
