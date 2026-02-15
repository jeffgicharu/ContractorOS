import { Module } from '@nestjs/common';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { ContractorsRepository } from './contractors.repository';

@Module({
  controllers: [ContractorsController],
  providers: [ContractorsService, ContractorsRepository],
  exports: [ContractorsService, ContractorsRepository],
})
export class ContractorsModule {}
