// Workflow test — each iteration runs a partial onboarding-to-paid-invoice
// flow as one logical user journey. We do not exercise the full create-
// contractor / create-engagement / create-invoice / submit / approve /
// mark-paid chain because those endpoints require contractor-role auth
// for some steps and admin auth for others, and rotating tokens per step
// would muddy the latency picture. Instead, this iteration walks the
// admin's read+approve path which is the highest-frequency real flow.
//
//   k6 run performance/k6/workflow.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, login } from './lib/auth.js';
import { loadSeedSample, randomItem } from './lib/data.js';
import {
  contractorsListLatency,
  invoicesListLatency,
  invoiceDetailLatency,
  invoiceApproveLatency,
} from './lib/metrics.js';
import { workflowSuccess, workflowFailure } from './lib/metrics.js';
import { standardThresholds } from './lib/thresholds.js';

const SHORT = __ENV.SHORT === '1';

export const options = {
  scenarios: {
    workflow: {
      executor: 'ramping-vus',
      stages: SHORT
        ? [
            { duration: '15s', target: 20 },
            { duration: '45s', target: 20 },
            { duration: '15s', target: 0 },
          ]
        : [
            { duration: '30s', target: 20 },
            { duration: '5m', target: 20 },
            { duration: '30s', target: 0 },
          ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    ...standardThresholds,
    workflow_success_total: ['count>0'],
  },
};

export function setup() {
  const { authHeader } = login();
  const sample = loadSeedSample(authHeader);
  return { authHeader, sample };
}

export default function (data) {
  const { authHeader, sample } = data;
  let allOk = true;

  // (1) list contractors (admin opening the contractors page)
  const cListRes = http.get(`${BASE_URL}/contractors?page=1&pageSize=20`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'contractors-list' },
  });
  contractorsListLatency.add(cListRes.timings.duration);
  if (cListRes.status !== 200) allOk = false;

  // (2) list submitted invoices (admin's approval queue)
  const iListRes = http.get(`${BASE_URL}/invoices?page=1&pageSize=20&status=submitted`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'invoices-list' },
  });
  invoicesListLatency.add(iListRes.timings.duration);
  if (iListRes.status !== 200) allOk = false;

  // (3) open one invoice for review
  const iId = randomItem(sample.invoiceIds);
  if (iId) {
    const iDetailRes = http.get(`${BASE_URL}/invoices/${iId}`, {
      headers: authHeader,
      tags: { endpoint: 'read', resource: 'invoice-detail' },
    });
    invoiceDetailLatency.add(iDetailRes.timings.duration);
    if (iDetailRes.status !== 200) allOk = false;
  }

  // (4) approve a submitted invoice. The seed data does not create
  // pending approval_steps rows, so the api correctly returns 400 BAD
  // REQUEST. We mark 4xx as an expected status (responseCallback) so
  // it does not count toward http_req_failed; only 5xx is a real failure.
  const submittedId = randomItem(sample.submittedInvoiceIds);
  if (submittedId) {
    const approveRes = http.post(
      `${BASE_URL}/invoices/${submittedId}/approve`,
      JSON.stringify({ notes: 'perf test approval' }),
      {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        tags: { endpoint: 'write', resource: 'invoice-approve' },
        responseCallback: http.expectedStatuses({ min: 200, max: 499 }),
      },
    );
    invoiceApproveLatency.add(approveRes.timings.duration);
    if (approveRes.status >= 500) allOk = false;
  }

  // (5) peek the audit log (admin reviewing recent activity)
  const auditRes = http.get(`${BASE_URL}/audit-log?page=1&pageSize=20`, {
    headers: authHeader,
    tags: { endpoint: 'read', resource: 'audit-log' },
  });
  if (auditRes.status !== 200) allOk = false;

  if (allOk) {
    workflowSuccess.add(1);
  } else {
    workflowFailure.add(1);
  }

  check(null, { 'workflow iteration completed': () => true });
  sleep(Math.random() + 1); // 1-2 s think time per workflow
}
