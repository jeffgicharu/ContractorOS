import { Trend, Counter } from 'k6/metrics';

// Custom per-endpoint trend metrics for finer-grained dashboards. The
// built-in http_req_duration{endpoint:...} tag set is what k6 thresholds
// consume; these named trends are what humans look at in the html output.

export const contractorsListLatency = new Trend('contractors_list_ms');
export const contractorDetailLatency = new Trend('contractor_detail_ms');
export const invoicesListLatency = new Trend('invoices_list_ms');
export const invoiceDetailLatency = new Trend('invoice_detail_ms');
export const invoiceCreateLatency = new Trend('invoice_create_ms');
export const invoiceSubmitLatency = new Trend('invoice_submit_ms');
export const invoiceApproveLatency = new Trend('invoice_approve_ms');
export const auditLogLatency = new Trend('audit_log_ms');
export const loginLatency = new Trend('login_ms');

export const workflowSuccess = new Counter('workflow_success_total');
export const workflowFailure = new Counter('workflow_failure_total');
