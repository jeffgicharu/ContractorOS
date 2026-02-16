import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { OnboardingStep } from '@contractor-os/shared';
import { OnboardingStepType } from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';

interface OnboardingStepRow {
  id: string;
  contractor_id: string;
  step_type: string;
  status: string;
  completed_at: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const STEP_TYPES = [
  OnboardingStepType.INVITE_ACCEPTED,
  OnboardingStepType.TAX_FORM_SUBMITTED,
  OnboardingStepType.CONTRACT_SIGNED,
  OnboardingStepType.BANK_DETAILS_SUBMITTED,
];

function mapRowToStep(row: OnboardingStepRow, contractorId: string): OnboardingStep {
  return {
    id: row.id,
    contractorId,
    stepType: row.step_type as OnboardingStep['stepType'],
    status: row.status as OnboardingStep['status'],
    completedAt: row.completed_at,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class OnboardingRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async createSteps(contractorId: string): Promise<void> {
    const values = STEP_TYPES.map((_, i) => `($1, $${i + 2})`).join(', ');
    await this.pool.query(
      `INSERT INTO onboarding_steps (contractor_id, step_type) VALUES ${values}`,
      [contractorId, ...STEP_TYPES],
    );
  }

  async findByContractorId(contractorId: string): Promise<OnboardingStep[]> {
    const { rows } = await this.pool.query<OnboardingStepRow>(
      `SELECT * FROM onboarding_steps
       WHERE contractor_id = $1
       ORDER BY created_at ASC`,
      [contractorId],
    );
    return rows.map((r) => mapRowToStep(r, contractorId));
  }

  async findStep(contractorId: string, stepType: string): Promise<OnboardingStep | null> {
    const { rows } = await this.pool.query<OnboardingStepRow>(
      `SELECT * FROM onboarding_steps
       WHERE contractor_id = $1 AND step_type = $2`,
      [contractorId, stepType],
    );
    if (!rows[0]) return null;
    return mapRowToStep(rows[0], contractorId);
  }

  async completeStep(
    contractorId: string,
    stepType: string,
    status: string,
    data: Record<string, unknown>,
  ): Promise<OnboardingStep | null> {
    const { rows } = await this.pool.query<OnboardingStepRow>(
      `UPDATE onboarding_steps
       SET status = $1, completed_at = now(), data = $2
       WHERE contractor_id = $3 AND step_type = $4
       RETURNING *`,
      [status, JSON.stringify(data), contractorId, stepType],
    );
    if (!rows[0]) return null;
    return mapRowToStep(rows[0], contractorId);
  }
}
