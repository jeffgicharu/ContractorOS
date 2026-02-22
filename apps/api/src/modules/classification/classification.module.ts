import { Module } from '@nestjs/common';
import { ContractorRiskController, ClassificationController } from './classification.controller';
import { ClassificationService } from './classification.service';
import { ClassificationRepository } from './classification.repository';
import { ClassificationCron } from './classification.cron';

@Module({
  controllers: [ContractorRiskController, ClassificationController],
  providers: [ClassificationService, ClassificationRepository, ClassificationCron],
  exports: [ClassificationService],
})
export class ClassificationModule {}
