// Centralised SLO budgets — restated from TEST_STRATEGY.md §6.
//
// p95 < 300 ms for read endpoints
// p95 < 500 ms for write endpoints
// HTTP error rate < 0.1 %
//
// Each test script imports the thresholds it cares about. k6 fails the run
// if a threshold is violated, which is what we want — a perf test that
// silently regresses is worse than no perf test.

export const READ_LATENCY_P95 = 300;
export const WRITE_LATENCY_P95 = 500;
export const REPORT_LATENCY_P95 = 1000; // dashboards, 1099 readiness, audit
export const ERROR_RATE_BUDGET = 0.001; // 0.1 %

export const standardThresholds = {
  http_req_failed: [`rate<${ERROR_RATE_BUDGET}`],
  http_req_duration: [`p(95)<${READ_LATENCY_P95}`],
  // Per-endpoint thresholds attach via tagged URLs (see metrics.js).
  'http_req_duration{endpoint:read}': [`p(95)<${READ_LATENCY_P95}`],
  'http_req_duration{endpoint:write}': [`p(95)<${WRITE_LATENCY_P95}`],
  'http_req_duration{endpoint:report}': [`p(95)<${REPORT_LATENCY_P95}`],
};

// For stress / spike tests we expect SLO violations under deliberately
// abusive load — we still want the test to RUN to completion so we
// capture the breaking point, so these are advisory thresholds only.
export const advisoryThresholds = {
  http_req_failed: [{ threshold: `rate<${ERROR_RATE_BUDGET}`, abortOnFail: false }],
  http_req_duration: [{ threshold: `p(95)<${READ_LATENCY_P95}`, abortOnFail: false }],
};
