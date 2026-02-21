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
  createInvoiceSchema,
  updateInvoiceSchema,
  rejectInvoiceSchema,
  disputeInvoiceSchema,
  scheduleInvoiceSchema,
  markPaidSchema,
  invoiceListQuerySchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type RejectInvoiceInput,
  type DisputeInvoiceInput,
  type ScheduleInvoiceInput,
  type MarkPaidInput,
  type InvoiceListQuery,
  UserRole,
} from '@contractor-os/shared';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(UserRole.CONTRACTOR)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createInvoiceSchema)) body: CreateInvoiceInput,
  ) {
    const result = await this.invoicesService.create(user, body);
    return { data: result };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(invoiceListQuerySchema)) query: InvoiceListQuery,
  ) {
    const { items, meta } = await this.invoicesService.findList(query, user);
    return { data: items, meta };
  }

  @Get('duplicate-check')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async duplicateCheck(
    @CurrentUser() user: JwtPayload,
    @Query('contractorId') contractorId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    const duplicates = await this.invoicesService.checkDuplicates(
      user,
      contractorId,
      periodStart,
      periodEnd,
    );
    return { data: duplicates };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.invoicesService.findDetail(id, user);
    return { data: result };
  }

  @Patch(':id')
  @Roles(UserRole.CONTRACTOR, UserRole.ADMIN)
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInvoiceSchema)) body: UpdateInvoiceInput,
  ) {
    const result = await this.invoicesService.update(id, user, body);
    return { data: result };
  }

  @Post(':id/submit')
  @Roles(UserRole.CONTRACTOR)
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.invoicesService.submit(id, user);
    return { data: { message: 'Invoice submitted' } };
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    await this.invoicesService.approve(id, user, body?.notes);
    return { data: { message: 'Invoice approved' } };
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectInvoiceSchema)) body: RejectInvoiceInput,
  ) {
    await this.invoicesService.reject(id, user, body);
    return { data: { message: 'Invoice rejected' } };
  }

  @Post(':id/dispute')
  @Roles(UserRole.ADMIN)
  async dispute(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(disputeInvoiceSchema)) body: DisputeInvoiceInput,
  ) {
    await this.invoicesService.dispute(id, user, body);
    return { data: { message: 'Invoice disputed' } };
  }

  @Post(':id/schedule')
  @Roles(UserRole.ADMIN)
  async schedule(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(scheduleInvoiceSchema)) body: ScheduleInvoiceInput,
  ) {
    await this.invoicesService.schedule(id, user, body);
    return { data: { message: 'Payment scheduled' } };
  }

  @Post(':id/mark-paid')
  @Roles(UserRole.ADMIN)
  async markPaid(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(markPaidSchema)) body: MarkPaidInput,
  ) {
    await this.invoicesService.markPaid(id, user, body);
    return { data: { message: 'Invoice marked as paid' } };
  }

  @Post(':id/cancel')
  @Roles(UserRole.CONTRACTOR, UserRole.ADMIN)
  async cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.invoicesService.cancel(id, user);
    return { data: { message: 'Invoice cancelled' } };
  }
}
