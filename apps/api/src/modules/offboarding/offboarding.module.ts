import { Module } from '@nestjs/common';
import { ContractorsModule } from '../contractors/contractors.module';
import { ContractorOffboardingController, OffboardingController } from './offboarding.controller';
import { OffboardingService } from './offboarding.service';
import { OffboardingRepository } from './offboarding.repository';

@Module({
  imports: [ContractorsModule],
  controllers: [ContractorOffboardingController, OffboardingController],
  providers: [OffboardingService, OffboardingRepository],
  exports: [OffboardingService, OffboardingRepository],
})
export class OffboardingModule {}
