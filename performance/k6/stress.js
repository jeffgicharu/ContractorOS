// Stress test — push past nominal load to find the breaking point. SLO
// thresholds are advisory here (the test is expected to violate them);
// the script must run to completion so we can read where p99 explodes
// and where the error rate climbs above 1 %.
//
//   k6 run performance/k6/stress.js

import http from 'k6/http';
import { sleep } from 'k6';
import { BASE_URL, login } from './lib/auth.js';
import { loadSeedSample, randomItem } from './lib/data.js';
import { advisoryThresholds } from './lib/thresholds.js';

const SHORT = __ENV.SHORT === '1';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      stages: SHORT
        ? [
            { duration: '1m', target: 200 },
            { duration: '1m', target: 200 },
            { duration: '30s', target: 0 },
          ]
        : [
            { duration: '5m', target: 200 },
            { duration: '5m', target: 200 },
            { duration: '2m', target: 0 },
          ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: advisoryThresholds,
};

export function setup() {
  const { authHeader } = login();
  const sample = loadSeedSample(authHeader);
  return { authHeader, sample };
}

export default function (data) {
  const { authHeader, sample } = data;
  const r = Math.random();

  if (r < 0.4) {
    http.get(`${BASE_URL}/invoices?page=1&pageSize=20`, {
      headers: authHeader,
      tags: { endpoint: 'read', resource: 'invoices-list' },
    });
  } else if (r < 0.7) {
    const iId = randomItem(sample.invoiceIds);
    if (iId) {
      http.get(`${BASE_URL}/invoices/${iId}`, {
        headers: authHeader,
        tags: { endpoint: 'read', resource: 'invoice-detail' },
      });
    }
  } else if (r < 0.85) {
    const cId = randomItem(sample.contractorIds);
    if (cId) {
      http.get(`${BASE_URL}/contractors/${cId}`, {
        headers: authHeader,
        tags: { endpoint: 'read', resource: 'contractor-detail' },
      });
    }
  } else {
    http.get(`${BASE_URL}/audit-log?page=1&pageSize=20`, {
      headers: authHeader,
      tags: { endpoint: 'read', resource: 'audit-log' },
    });
  }
  sleep(0.3);
}
