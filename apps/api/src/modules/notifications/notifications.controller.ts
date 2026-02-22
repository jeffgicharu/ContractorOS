import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  notificationListQuerySchema,
  type NotificationListQuery,
  UserRole,
} from '@contractor-os/shared';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(notificationListQuerySchema)) query: NotificationListQuery,
  ) {
    const { items, meta } = await this.notificationsService.findList(user.sub, query);
    const unreadCount = await this.notificationsService.getUnreadCount(user.sub);
    return { data: items, meta: { ...meta, unreadCount } };
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.notificationsService.markRead(id, user.sub);
    return { data: { message: 'Notification marked as read' } };
  }

  @Post('mark-all-read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async markAllRead(@CurrentUser() user: JwtPayload) {
    const count = await this.notificationsService.markAllRead(user.sub);
    return { data: { count } };
  }
}
