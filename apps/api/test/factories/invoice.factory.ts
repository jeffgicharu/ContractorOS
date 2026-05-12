import type { Pool } from 'pg';
import { InvoiceStatus } from '@contractor-os/shared';

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: string;
}

interface InvoiceInput {
  pool: Pool;
  orgId: string;
  contractorId: string;
  engagementId: string;
  status?: InvoiceStatus;
  invoiceNumber?: string;
  subtotal?: number;
  total?: number;
  periodStart?: string;
  periodEnd?: string;
}

export async function createInvoice({
  pool,
  orgId,
  contractorId,
  engagementId,
  status = InvoiceStatus.DRAFT,
  invoiceNumber = `INV-${Date.now()}`,
  subtotal = 1000,
  total = 1000,
  periodStart = '2026-04-01',
  periodEnd = '2026-04-30',
}: InvoiceInput): Promise<InvoiceRow> {
  const { rows } = await pool.query<InvoiceRow>(
    `INSERT INTO invoices (
       contractor_id, engagement_id, organization_id, invoice_number, status,
       subtotal, total_amount, period_start, period_end
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, invoice_number AS "invoiceNumber", status, total_amount AS "totalAmount"`,
    [contractorId, engagementId, orgId, invoiceNumber, status, subtotal, total, periodStart, periodEnd],
  );
  return rows[0];
}
