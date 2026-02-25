import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
  timeEntryListQuerySchema,
  type CreateTimeEntryInput,
  type UpdateTimeEntryInput,
  type TimeEntryListQuery,
  UserRole,
} from '@contractor-os/shared';
import { TimeEntriesService } from './time-entries.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('time-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post()
  @Roles(UserRole.CONTRACTOR)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createTimeEntrySchema)) body: CreateTimeEntryInput,
  ) {
    const result = await this.timeEntriesService.create(user.sub, body);
    return { data: result };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(timeEntryListQuerySchema)) query: TimeEntryListQuery,
  ) {
    const { items, meta } = await this.timeEntriesService.findList(query, user);
    return { data: items, meta };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.timeEntriesService.findById(id, user);
    return { data: result };
  }

  @Patch(':id')
  @Roles(UserRole.CONTRACTOR)
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTimeEntrySchema)) body: UpdateTimeEntryInput,
  ) {
    const result = await this.timeEntriesService.update(id, body, user);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.CONTRACTOR)
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.timeEntriesService.delete(id, user);
  }
}
