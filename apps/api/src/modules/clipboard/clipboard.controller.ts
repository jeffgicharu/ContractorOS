import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  clipboardUpdateSchema,
  type ClipboardUpdateInput,
} from '@contractor-os/shared';
import { ClipboardService } from './clipboard.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

// Intentionally unauthenticated: the landing page exposes a public
// paste-and-copy clipboard. Writes get a tighter throttle than the
// global default to limit abuse.
@Controller('clipboard')
export class ClipboardController {
  constructor(private readonly clipboardService: ClipboardService) {}

  @Get()
  async get() {
    return { data: await this.clipboardService.get() };
  }

  @Patch()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async update(
    @Body(new ZodValidationPipe(clipboardUpdateSchema)) body: ClipboardUpdateInput,
  ) {
    return { data: await this.clipboardService.update(body.content) };
  }
}
