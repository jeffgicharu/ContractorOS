import { Module } from '@nestjs/common';
import { ContractorsModule } from '../contractors/contractors.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContractorOffboardingController, OffboardingController } from './offboarding.controller';
import { OffboardingService } from './offboarding.service';
import { OffboardingRepository } from './offboarding.repository';

@Module({
  imports: [ContractorsModule, NotificationsModule],
  controllers: [ContractorOffboardingController, OffboardingController],
  providers: [OffboardingService, OffboardingRepository],
  exports: [OffboardingService, OffboardingRepository],
})
export class OffboardingModule {}
