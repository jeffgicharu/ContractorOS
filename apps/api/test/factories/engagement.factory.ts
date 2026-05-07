import type { Pool } from 'pg';
import { EngagementStatus, PaymentTerms } from '@contractor-os/shared';

export interface EngagementRow {
  id: string;
  contractorId: string;
  organizationId: string;
  status: EngagementStatus;
  hourlyRate: string | null;
  fixedRate: string | null;
}

interface EngagementInput {
  pool: Pool;
  orgId: string;
  contractorId: string;
  status?: EngagementStatus;
  title?: string;
  hourlyRate?: number;
  fixedRate?: number;
  paymentTerms?: PaymentTerms;
}

export async function createEngagement({
  pool,
  orgId,
  contractorId,
  status = EngagementStatus.ACTIVE,
  title = 'Q2 Backend Engagement',
  hourlyRate = 100,
  fixedRate,
  paymentTerms = PaymentTerms.NET_30,
}: EngagementInput): Promise<EngagementRow> {
  const { rows } = await pool.query<EngagementRow>(
    `INSERT INTO engagements (
       contractor_id, organization_id, title, start_date, hourly_rate, fixed_rate,
       currency, payment_terms, status
     ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, 'USD', $6, $7)
     RETURNING id, contractor_id AS "contractorId", organization_id AS "organizationId",
       status, hourly_rate AS "hourlyRate", fixed_rate AS "fixedRate"`,
    [contractorId, orgId, title, hourlyRate ?? null, fixedRate ?? null, paymentTerms, status],
  );
  return rows[0];
}
