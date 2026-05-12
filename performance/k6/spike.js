// Spike test — sudden surge from baseline to 30x peak load and back, used
// to measure how quickly the system recovers (RTO).
//
//   k6 run performance/k6/spike.js

import http from 'k6/http';
import { sleep } from 'k6';
import { BASE_URL, login } from './lib/auth.js';
import { loadSeedSample, randomItem } from './lib/data.js';
import { advisoryThresholds } from './lib/thresholds.js';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 10 },
        { duration: '15s', target: 300 },
        { duration: '1m', target: 300 },
        { duration: '15s', target: 10 },
        { duration: '30s', target: 10 },
      ],
      gracefulRampDown: '15s',
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
  const iId = randomItem(sample.invoiceIds);
  const cId = randomItem(sample.contractorIds);

  // Mostly reads — a spike is typically a traffic surge, not a write surge
  http.get(`${BASE_URL}/invoices?page=1&pageSize=20`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'invoices-list' },
  });
  if (iId) {
    http.get(`${BASE_URL}/invoices/${iId}`, {
      headers: authHeader,
      tags: { endpoint: 'read', resource: 'invoice-detail' },
    });
  }
  if (cId) {
    http.get(`${BASE_URL}/contractors/${cId}`, {
      headers: authHeader,
      tags: { endpoint: 'read', resource: 'contractor-detail' },
    });
  }
  sleep(0.2);
}
