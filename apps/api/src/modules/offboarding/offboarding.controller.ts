import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  initiateOffboardingSchema,
  updateOffboardingSchema,
  updateChecklistItemSchema,
  offboardingListQuerySchema,
  type InitiateOffboardingInput,
  type UpdateOffboardingInput,
  type UpdateChecklistItemInput,
  type OffboardingListQuery,
  UserRole,
} from '@contractor-os/shared';
import { OffboardingService } from './offboarding.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractorOffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  @Post(':id/offboard')
  @Roles(UserRole.ADMIN)
  async initiateOffboarding(
    @CurrentUser() user: JwtPayload,
    @Param('id') contractorId: string,
    @Body(new ZodValidationPipe(initiateOffboardingSchema)) body: InitiateOffboardingInput,
  ) {
    const result = await this.offboardingService.initiateOffboarding(
      contractorId,
      user.orgId,
      user.sub,
      body,
    );
    return { data: result };
  }

  @Get(':id/offboarding')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getContractorOffboarding(
    @CurrentUser() user: JwtPayload,
    @Param('id') contractorId: string,
  ) {
    const result = await this.offboardingService.getWorkflowByContractor(contractorId, user.orgId);
    return { data: result };
  }
}

@Controller('offboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async listWorkflows(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(offboardingListQuerySchema)) query: OffboardingListQuery,
  ) {
    const { items, total } = await this.offboardingService.listWorkflows(user.orgId, {
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    return {
      data: items,
      meta: {
        page: query.page,
        pageSize: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getWorkflow(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.offboardingService.getWorkflow(id, user.orgId);
    return { data: result };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateWorkflowStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOffboardingSchema)) body: UpdateOffboardingInput,
  ) {
    const result = await this.offboardingService.updateWorkflowStatus(
      id,
      user.orgId,
      body.status,
      body.notes,
    );
    return { data: result };
  }

  @Patch(':id/checklist/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateChecklistItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') workflowId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateChecklistItemSchema)) body: UpdateChecklistItemInput,
  ) {
    const result = await this.offboardingService.updateChecklistItem(
      workflowId,
      itemId,
      user.orgId,
      user.sub,
      body,
    );
    return { data: result };
  }
}
