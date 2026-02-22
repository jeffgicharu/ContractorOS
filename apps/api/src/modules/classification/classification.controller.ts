import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  assessmentHistoryQuerySchema,
  factorListQuerySchema,
  submitFactorSchema,
  type AssessmentHistoryQuery,
  type FactorListQuery,
  type SubmitFactorInput,
  UserRole,
} from '@contractor-os/shared';
import { ClassificationService } from './classification.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractorRiskController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Get(':id/risk-assessment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getLatest(
    @CurrentUser() user: JwtPayload,
    @Param('id') contractorId: string,
  ) {
    const result = await this.classificationService.getLatestAssessment(contractorId, user);
    return { data: result };
  }

  @Get(':id/risk-assessment/history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getHistory(
    @Param('id') contractorId: string,
    @Query(new ZodValidationPipe(assessmentHistoryQuerySchema)) query: AssessmentHistoryQuery,
  ) {
    const result = await this.classificationService.getAssessmentHistory(
      contractorId,
      query.limit,
    );
    return { data: result };
  }

  @Post(':id/risk-assessment/run')
  @Roles(UserRole.ADMIN)
  async runAssessment(
    @CurrentUser() user: JwtPayload,
    @Param('id') contractorId: string,
  ) {
    const result = await this.classificationService.runAssessment(contractorId, user.orgId);
    return { data: result };
  }
}

@Controller('classification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getDashboard(@CurrentUser() user: JwtPayload) {
    const result = await this.classificationService.getDashboard(user);
    return { data: result };
  }

  @Get('factors/:contractorId')
  @Roles(UserRole.ADMIN)
  async getFactors(
    @Param('contractorId') contractorId: string,
    @Query(new ZodValidationPipe(factorListQuerySchema)) query: FactorListQuery,
  ) {
    const result = await this.classificationService.getFactors(
      contractorId,
      query.category,
      query.source,
    );
    return { data: result };
  }

  @Post('factors/:contractorId')
  @Roles(UserRole.ADMIN)
  async submitFactor(
    @Param('contractorId') contractorId: string,
    @Body(new ZodValidationPipe(submitFactorSchema)) body: SubmitFactorInput,
  ) {
    const result = await this.classificationService.submitFactor(contractorId, body);
    return { data: result };
  }
}
