import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContractorRiskController, ClassificationController } from './classification.controller';
import { ClassificationService } from './classification.service';
import { ClassificationRepository } from './classification.repository';
import { ClassificationCron } from './classification.cron';

@Module({
  imports: [NotificationsModule],
  controllers: [ContractorRiskController, ClassificationController],
  providers: [ClassificationService, ClassificationRepository, ClassificationCron],
  exports: [ClassificationService],
})
export class ClassificationModule {}
