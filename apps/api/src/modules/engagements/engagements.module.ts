import { Module } from '@nestjs/common';
import { ContractorsModule } from '../contractors/contractors.module';
import { ContractorEngagementsController, EngagementsController } from './engagements.controller';
import { EngagementsService } from './engagements.service';
import { EngagementsRepository } from './engagements.repository';

@Module({
  imports: [ContractorsModule],
  controllers: [ContractorEngagementsController, EngagementsController],
  providers: [EngagementsService, EngagementsRepository],
  exports: [EngagementsService, EngagementsRepository],
})
export class EngagementsModule {}
