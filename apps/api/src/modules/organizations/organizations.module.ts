import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationsRepository } from './organizations.repository';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';

@Module({
  controllers: [OrganizationsController, DashboardController],
  providers: [
    OrganizationsService,
    OrganizationsRepository,
    DashboardRepository,
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
