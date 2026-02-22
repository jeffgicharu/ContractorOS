import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  auditLogQuerySchema,
  type AuditLogQuery,
  UserRole,
} from '@contractor-os/shared';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(auditLogQuerySchema)) query: AuditLogQuery,
  ) {
    const { items, meta } = await this.auditService.findList(user.orgId, query);
    return { data: items, meta };
  }
}
