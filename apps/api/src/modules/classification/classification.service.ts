import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import type {
  ClassificationAssessment,
  ClassificationFactor,
  ClassificationInputData,
  ClassificationDashboard,
  FactorCategory,
  FactorSource,
} from '@contractor-os/shared';
import { FactorCategory as FC } from '@contractor-os/shared';
import { ClassificationRepository } from './classification.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { scoreIrsTest } from './scoring/irs-test.scorer';
import { scoreDolTest } from './scoring/dol-test.scorer';
import { scoreAbcTest } from './scoring/abc-test.scorer';
import { aggregateRiskScore } from './scoring/risk-aggregator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  constructor(
    private readonly repo: ClassificationRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async runAssessment(
    contractorId: string,
    orgId: string,
  ): Promise<ClassificationAssessment> {
    // Step 1: Get computed factors from time entries
    const computed = await this.repo.getComputedFactorsFromTimeEntries(contractorId);

    // Step 2: Build base input from computed data
    const input = this.buildInputFromComputedFactors(computed);

    // Step 3: Get manual factors and merge (manual overrides computed)
    const manualFactors = await this.repo.findFactors(contractorId);
    this.mergeManualFactors(input, manualFactors);

    // Step 4: Score all three tests
    const irsResult = scoreIrsTest(input);
    const dolResult = scoreDolTest(input);
    const abcResult = scoreAbcTest(input);

    // Step 5: Aggregate
    const { overallScore, overallRisk } = aggregateRiskScore(
      irsResult.score,
      dolResult.score,
      abcResult.score,
    );

    // Step 6: Check if risk changed from previous assessment
    const previous = await this.repo.findLatestAssessment(contractorId);
    const previousRisk = previous?.overallRisk;

    // Step 7: Persist
    const assessment = await this.repo.createAssessment({
      contractorId,
      organizationId: orgId,
      overallRisk,
      overallScore,
      irsScore: irsResult.score,
      irsFactors: irsResult.factors,
      dolScore: dolResult.score,
      dolFactors: dolResult.factors,
      abcScore: abcResult.score,
      abcFactors: abcResult.factors,
      inputData: input,
    });

    // Step 8: Notify if risk level changed
    if (previousRisk && previousRisk !== overallRisk) {
      this.notificationsService.createForAdmins(
        orgId,
        'classification_risk_change' as import('@contractor-os/shared').NotificationType,
        'Risk Level Changed',
        `Contractor risk level changed from ${previousRisk} to ${overallRisk}`,
        { contractorId, oldRisk: previousRisk, newRisk: overallRisk, score: overallScore },
      ).catch((err) => this.logger.error('Failed to send risk change notification', err));
    }

    return assessment;
  }

  async getLatestAssessment(
    contractorId: string,
    user: JwtPayload,
  ): Promise<ClassificationAssessment> {
    const assessment = await this.repo.findLatestAssessment(contractorId);
    if (!assessment) {
      throw new NotFoundException('No assessment found for this contractor');
    }
    return assessment;
  }

  async getAssessmentHistory(
    contractorId: string,
    limit: number,
  ): Promise<ClassificationAssessment[]> {
    return this.repo.findAssessmentHistory(contractorId, limit);
  }

  async getDashboard(user: JwtPayload): Promise<ClassificationDashboard> {
    const { summary, topRisk } = await this.repo.getDashboardSummary(user.orgId);
    const total = summary.low + summary.medium + summary.high + summary.critical;

    return {
      summary: {
        low: summary.low,
        medium: summary.medium,
        high: summary.high,
        critical: summary.critical,
        total,
      },
      topRiskContractors: topRisk.map((r) => ({
        contractorId: r.contractorId,
        contractorName: r.contractorName,
        overallRisk: r.overallRisk!,
        overallScore: r.overallScore!,
        assessedAt: r.assessedAt!,
      })),
    };
  }

  async getFactors(
    contractorId: string,
    category?: FactorCategory,
    source?: FactorSource,
  ): Promise<ClassificationFactor[]> {
    return this.repo.findFactors(contractorId, category, source);
  }

  async submitFactor(
    contractorId: string,
    input: {
      category: FactorCategory;
      numericValue?: number;
      booleanValue?: boolean;
      textValue?: string;
      periodStart: string;
      periodEnd: string;
    },
  ): Promise<ClassificationFactor> {
    return this.repo.createFactor({
      contractorId,
      category: input.category,
      numericValue: input.numericValue,
      booleanValue: input.booleanValue,
      textValue: input.textValue,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      source: 'manual' as FactorSource,
    });
  }

  async reassessAllActive(): Promise<void> {
    this.logger.log('Starting daily classification reassessment');
    const orgIds = await this.repo.getAllOrgIds();

    let totalAssessed = 0;
    for (const orgId of orgIds) {
      const contractorIds = await this.repo.getActiveContractorIds(orgId);
      for (const contractorId of contractorIds) {
        try {
          await this.runAssessment(contractorId, orgId);
          totalAssessed++;
        } catch (err) {
          this.logger.error(
            `Failed to assess contractor ${contractorId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    await this.repo.refreshMaterializedView();
    this.logger.log(`Reassessment complete: ${totalAssessed} contractors assessed`);
  }

  private buildInputFromComputedFactors(computed: {
    avgWeeklyHours: number;
    totalWeeks: number;
    engagementCount: number;
  }): ClassificationInputData {
    return {
      hoursPerWeek: computed.avgWeeklyHours,
      engagementDurationWeeks: computed.totalWeeks,
      multipleClients: computed.engagementCount > 1,
    };
  }

  private mergeManualFactors(
    input: ClassificationInputData,
    factors: ClassificationFactor[],
  ): void {
    // Sort by created_at so latest override wins
    const sorted = [...factors].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    for (const factor of sorted) {
      switch (factor.category) {
        case FC.HOURS_PER_WEEK:
          if (factor.numericValue !== null) input.hoursPerWeek = factor.numericValue;
          break;
        case FC.ENGAGEMENT_DURATION_WEEKS:
          if (factor.numericValue !== null) input.engagementDurationWeeks = factor.numericValue;
          break;
        case FC.EXCLUSIVITY_RATIO:
          if (factor.numericValue !== null) input.exclusivityRatio = factor.numericValue;
          break;
        case FC.SET_SCHEDULE:
          if (factor.booleanValue !== null) input.setSchedule = factor.booleanValue;
          break;
        case FC.TOOLS_PROVIDED:
          if (factor.booleanValue !== null) input.toolsProvided = factor.booleanValue;
          break;
        case FC.TRAINING_PROVIDED:
          if (factor.booleanValue !== null) input.trainingProvided = factor.booleanValue;
          break;
        case FC.SUPERVISION_LEVEL:
          if (factor.textValue !== null) input.supervisionLevel = factor.textValue;
          break;
        case FC.INTEGRATION_LEVEL:
          if (factor.textValue !== null) input.integrationLevel = factor.textValue;
          break;
        case FC.MULTIPLE_CLIENTS:
          if (factor.booleanValue !== null) input.multipleClients = factor.booleanValue;
          break;
        case FC.PROFIT_LOSS_OPPORTUNITY:
          if (factor.booleanValue !== null) input.profitLossOpportunity = factor.booleanValue;
          break;
        case FC.SIGNIFICANT_INVESTMENT:
          if (factor.booleanValue !== null) input.significantInvestment = factor.booleanValue;
          break;
      }
    }
  }
}
