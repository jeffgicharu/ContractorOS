import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@contractor-os/shared';
import { DashboardRepository } from './dashboard.repository';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type JwtPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardRepo: DashboardRepository) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats(@CurrentUser() user: JwtPayload) {
    const [monthlyRevenue, invoiceBreakdown, contractorBreakdown, contractorGrowth] =
      await Promise.all([
        this.dashboardRepo.getMonthlyRevenue(user.orgId, 6),
        this.dashboardRepo.getInvoiceStatusBreakdown(user.orgId),
        this.dashboardRepo.getContractorStatusBreakdown(user.orgId),
        this.dashboardRepo.getMonthlyContractorGrowth(user.orgId, 6),
      ]);

    return {
      data: {
        monthlyRevenue,
        invoiceBreakdown,
        contractorBreakdown,
        contractorGrowth,
      },
    };
  }

  @Get('portal-stats')
  @Roles(UserRole.CONTRACTOR)
  async getPortalStats(@CurrentUser() user: JwtPayload) {
    const contractorId =
      await this.dashboardRepo.findContractorIdByUserId(user.sub);

    if (!contractorId) {
      return { data: { monthlyEarnings: [] } };
    }

    const earnings = await this.dashboardRepo.getContractorMonthlyEarnings(
      contractorId,
      6,
    );

    return { data: { monthlyEarnings: earnings } };
  }
}
