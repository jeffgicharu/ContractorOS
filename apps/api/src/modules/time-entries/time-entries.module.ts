import { Module } from '@nestjs/common';
import { EngagementsModule } from '../engagements/engagements.module';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntriesRepository } from './time-entries.repository';

@Module({
  imports: [EngagementsModule],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService, TimeEntriesRepository],
  exports: [TimeEntriesService, TimeEntriesRepository],
})
export class TimeEntriesModule {}
