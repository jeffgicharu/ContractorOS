// Smoke test — minimal load against every endpoint we care about.
// Used in CI on every PR. Fails the run on any SLO violation.
//
//   k6 run performance/k6/smoke.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, login } from './lib/auth.js';
import { loadSeedSample, randomItem } from './lib/data.js';
import {
  contractorsListLatency,
  contractorDetailLatency,
  invoicesListLatency,
  invoiceDetailLatency,
  auditLogLatency,
  loginLatency,
} from './lib/metrics.js';
import { standardThresholds } from './lib/thresholds.js';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },
  },
  thresholds: standardThresholds,
};

export function setup() {
  const { authHeader } = login();
  const sample = loadSeedSample(authHeader);
  return { authHeader, sample };
}

export default function (data) {
  const { authHeader, sample } = data;

  // 1. Login (fresh for every iteration to keep the auth path measured)
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'admin@perf.test', password: 'Password1' }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'auth' } },
  );
  loginLatency.add(loginRes.timings.duration);
  check(loginRes, { 'login 200': (r) => r.status === 200 });

  // 2. List contractors
  const cListRes = http.get(`${BASE_URL}/contractors?page=1&pageSize=20`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'contractors-list' },
  });
  contractorsListLatency.add(cListRes.timings.duration);
  check(cListRes, { 'list contractors 200': (r) => r.status === 200 });

  // 3. Contractor detail
  const cId = randomItem(sample.contractorIds);
  if (cId) {
    const cDetailRes = http.get(`${BASE_URL}/contractors/${cId}`, {
      headers: authHeader,
      tags: { endpoint: 'read', resource: 'contractor-detail' },
    });
    contractorDetailLatency.add(cDetailRes.timings.duration);
    check(cDetailRes, { 'contractor detail 200': (r) => r.status === 200 });
  }

  // 4. List invoices
  const iListRes = http.get(`${BASE_URL}/invoices?page=1&pageSize=20`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'invoices-list' },
  });
  invoicesListLatency.add(iListRes.timings.duration);
  check(iListRes, { 'list invoices 200': (r) => r.status === 200 });

  // 5. Invoice detail
  const iId = randomItem(sample.invoiceIds);
  if (iId) {
    const iDetailRes = http.get(`${BASE_URL}/invoices/${iId}`, {
      headers: authHeader,
      tags: { endpoint: 'read', resource: 'invoice-detail' },
    });
    invoiceDetailLatency.add(iDetailRes.timings.duration);
    check(iDetailRes, { 'invoice detail 200': (r) => r.status === 200 });
  }

  // 6. Audit log
  const auditRes = http.get(`${BASE_URL}/audit-log?page=1&pageSize=20`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'audit-log' },
  });
  auditLogLatency.add(auditRes.timings.duration);
  check(auditRes, { 'audit log 200': (r) => r.status === 200 });

  sleep(1);
}
