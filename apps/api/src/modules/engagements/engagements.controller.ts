import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  createEngagementSchema,
  updateEngagementSchema,
  updateEngagementStatusSchema,
  type CreateEngagementInput,
  type UpdateEngagementInput,
  type UpdateEngagementStatusInput,
  UserRole,
} from '@contractor-os/shared';
import { EngagementsService } from './engagements.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('contractors/:contractorId/engagements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractorEngagementsController {
  constructor(private readonly engagementsService: EngagementsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @CurrentUser() user: JwtPayload,
    @Param('contractorId') contractorId: string,
    @Body(new ZodValidationPipe(createEngagementSchema)) body: CreateEngagementInput,
  ) {
    const result = await this.engagementsService.create(user.orgId, contractorId, body);
    return { data: result };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async list(
    @CurrentUser() user: JwtPayload,
    @Param('contractorId') contractorId: string,
  ) {
    const items = await this.engagementsService.findByContractor(user.orgId, contractorId);
    return { data: items };
  }
}

@Controller('engagements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementsController {
  constructor(private readonly engagementsService: EngagementsService) {}

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.engagementsService.findById(user.orgId, id);
    return { data: result };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEngagementSchema)) body: UpdateEngagementInput,
  ) {
    const result = await this.engagementsService.update(user.orgId, id, body);
    return { data: result };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async transitionStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEngagementStatusSchema)) body: UpdateEngagementStatusInput,
  ) {
    await this.engagementsService.transitionStatus(user.orgId, id, body.status);
    return { data: { message: 'Status updated' } };
  }
}
