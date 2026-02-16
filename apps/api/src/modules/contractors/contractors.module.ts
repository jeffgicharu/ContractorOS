import { Module } from '@nestjs/common';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { ContractorsRepository } from './contractors.repository';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';

@Module({
  controllers: [ContractorsController],
  providers: [
    ContractorsService,
    ContractorsRepository,
    OnboardingService,
    OnboardingRepository,
  ],
  exports: [ContractorsService, ContractorsRepository, OnboardingService],
})
export class ContractorsModule {}
