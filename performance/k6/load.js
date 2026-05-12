// Load test — sustained nominal traffic. Distribute traffic ~70/25/5 across
// reads / mixed / writes so the throughput per endpoint is realistic.
//
//   k6 run performance/k6/load.js

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
} from './lib/metrics.js';
import { standardThresholds } from './lib/thresholds.js';

const SHORT = __ENV.SHORT === '1';

export const options = {
  scenarios: {
    nominal_load: {
      executor: 'ramping-vus',
      stages: SHORT
        ? [
            { duration: '20s', target: 50 },
            { duration: '40s', target: 50 },
            { duration: '20s', target: 0 },
          ]
        : [
            { duration: '1m', target: 50 },
            { duration: '5m', target: 50 },
            { duration: '1m', target: 0 },
          ],
      gracefulRampDown: '30s',
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
  const r = Math.random();

  if (r < 0.7) {
    // 70 % pure reads
    const choice = Math.random();
    if (choice < 0.25) {
      const res = http.get(`${BASE_URL}/contractors?page=1&pageSize=20`, {
        headers: authHeader,
        tags: { endpoint: 'read', resource: 'contractors-list' },
      });
      contractorsListLatency.add(res.timings.duration);
    } else if (choice < 0.5) {
      const cId = randomItem(sample.contractorIds);
      if (cId) {
        const res = http.get(`${BASE_URL}/contractors/${cId}`, {
          headers: authHeader,
          tags: { endpoint: 'read', resource: 'contractor-detail' },
        });
        contractorDetailLatency.add(res.timings.duration);
      }
    } else if (choice < 0.75) {
      // List invoices with various filter combinations
      const filters = [
        '?page=1&pageSize=20',
        '?page=1&pageSize=20&status=draft',
        '?page=1&pageSize=20&status=submitted',
        '?page=2&pageSize=20',
      ];
      const filter = filters[Math.floor(Math.random() * filters.length)];
      const res = http.get(`${BASE_URL}/invoices${filter}`, {
        headers: authHeader,
        tags: { endpoint: 'read', resource: 'invoices-list' },
      });
      invoicesListLatency.add(res.timings.duration);
    } else if (choice < 0.95) {
      const iId = randomItem(sample.invoiceIds);
      if (iId) {
        const res = http.get(`${BASE_URL}/invoices/${iId}`, {
          headers: authHeader,
          tags: { endpoint: 'read', resource: 'invoice-detail' },
        });
        invoiceDetailLatency.add(res.timings.duration);
      }
    } else {
      const res = http.get(`${BASE_URL}/audit-log?page=1&pageSize=20`, {
        headers: authHeader,
        tags: { endpoint: 'read', resource: 'audit-log' },
      });
      auditLogLatency.add(res.timings.duration);
    }
  } else if (r < 0.95) {
    // 25 % mixed read+write — fetch then attempt a state transition.
    // Pure write endpoints (POST /invoices) require contractor auth which
    // is not what the perf admin holds, so this branch is a conservative
    // proxy: list + read + (no-op) settings GET that exercises the write
    // path's auth+RBAC pipeline without mutating data.
    const iId = randomItem(sample.invoiceIds);
    if (iId) {
      http.get(`${BASE_URL}/invoices/${iId}`, {
        headers: authHeader,
        tags: { endpoint: 'read', resource: 'invoice-detail' },
      });
    }
    http.get(`${BASE_URL}/organizations/settings`, {
      headers: authHeader,
      tags: { endpoint: 'read', resource: 'org-settings' },
    });
  } else {
    // 5 % pure writes — settings PATCH no-op. The admin endpoint accepts
    // an empty PATCH body and returns the unchanged resource, which is
    // representative of the write-path latency without polluting the
    // perf DB.
    const res = http.patch(
      `${BASE_URL}/organizations/settings`,
      JSON.stringify({}),
      {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        tags: { endpoint: 'write', resource: 'org-settings-patch' },
      },
    );
    check(res, { 'org-settings patch 2xx': (r) => r.status >= 200 && r.status < 300 });
  }

  sleep(Math.random() * 0.5 + 0.5); // 0.5-1.0s think time per VU
}
