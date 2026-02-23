import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  updateOrganizationSettingsSchema,
  type UpdateOrganizationSettings,
  UserRole,
} from '@contractor-os/shared';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get('settings')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSettings(@CurrentUser() user: JwtPayload) {
    const org = await this.orgService.getOrganization(user.orgId);
    return { data: org };
  }

  @Patch('settings')
  @Roles(UserRole.ADMIN)
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateOrganizationSettingsSchema))
    dto: UpdateOrganizationSettings,
  ) {
    const org = await this.orgService.updateSettings(user.orgId, dto);
    return { data: org };
  }
}
