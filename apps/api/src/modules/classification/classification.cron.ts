import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClassificationService } from './classification.service';

@Injectable()
export class ClassificationCron {
  private readonly logger = new Logger(ClassificationCron.name);

  constructor(private readonly classificationService: ClassificationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyReassessment(): Promise<void> {
    this.logger.log('CRON: Starting daily classification reassessment');
    try {
      await this.classificationService.reassessAllActive();
      this.logger.log('CRON: Daily reassessment completed successfully');
    } catch (err) {
      this.logger.error(
        `CRON: Daily reassessment failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
