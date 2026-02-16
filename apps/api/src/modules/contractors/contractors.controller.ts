import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  createContractorSchema,
  updateContractorSchema,
  bulkInviteSchema,
  contractorListQuerySchema,
  completeOnboardingStepSchema,
  type CreateContractorInput,
  type UpdateContractorInput,
  type BulkInviteInput,
  type ContractorListQuery,
  type CompleteOnboardingStepInput,
  type ContractorStatus,
  UserRole,
} from '@contractor-os/shared';
import { ContractorsService } from './contractors.service';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractorsController {
  constructor(
    private readonly contractorsService: ContractorsService,
    private readonly onboardingService: OnboardingService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UsePipes(new ZodValidationPipe(createContractorSchema))
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateContractorInput,
  ) {
    const result = await this.contractorsService.create(user.orgId, body);
    return { data: result };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(contractorListQuerySchema)) query: ContractorListQuery,
  ) {
    const { items, meta } = await this.contractorsService.list(user.orgId, query);
    return { data: items, meta };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const detail = await this.contractorsService.getDetail(user.orgId, id);
    return { data: detail };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ZodValidationPipe(updateContractorSchema))
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateContractorInput,
  ) {
    const result = await this.contractorsService.update(user.orgId, id, body);
    return { data: result };
  }

  @Post(':id/reinvite')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async reinvite(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.contractorsService.reinvite(user.orgId, id);
    return { data: { message: 'Invite resent' } };
  }

  @Post('bulk-invite')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ZodValidationPipe(bulkInviteSchema))
  async bulkInvite(
    @CurrentUser() user: JwtPayload,
    @Body() body: BulkInviteInput,
  ) {
    const result = await this.contractorsService.bulkInvite(user.orgId, body);
    return { data: result };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async transitionStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: ContractorStatus; reason?: string },
  ) {
    await this.contractorsService.transitionStatus(
      user.orgId,
      id,
      body.status,
      user.sub,
      body.reason,
    );
    return { data: { message: 'Status updated' } };
  }

  @Get(':id/onboarding')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getOnboarding(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const onboarding = await this.onboardingService.getOnboardingStatus(user.orgId, id);
    return { data: onboarding };
  }

  @Patch(':id/onboarding/:stepType')
  @Roles(UserRole.ADMIN, UserRole.CONTRACTOR)
  async completeOnboardingStep(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('stepType') stepType: string,
    @Body(new ZodValidationPipe(completeOnboardingStepSchema)) body: CompleteOnboardingStepInput,
  ) {
    const result = await this.onboardingService.completeStep(
      user.orgId,
      id,
      stepType,
      body,
      user.sub,
    );
    return { data: result };
  }
}
