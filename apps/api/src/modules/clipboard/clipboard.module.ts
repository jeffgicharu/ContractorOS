import { Module } from '@nestjs/common';
import { ClipboardController } from './clipboard.controller';
import { ClipboardService } from './clipboard.service';
import { ClipboardRepository } from './clipboard.repository';

@Module({
  controllers: [ClipboardController],
  providers: [ClipboardService, ClipboardRepository],
})
export class ClipboardModule {}
