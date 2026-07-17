import { Injectable, Logger } from '@nestjs/common';
import type { SharedClipboard } from '@contractor-os/shared';
import { ClipboardRepository } from './clipboard.repository';

const EMPTY_CLIPBOARD: SharedClipboard = {
  content: '',
  updatedAt: new Date(0).toISOString(),
};

@Injectable()
export class ClipboardService {
  private readonly logger = new Logger(ClipboardService.name);

  constructor(private readonly repo: ClipboardRepository) {}

  async get(): Promise<SharedClipboard> {
    const clipboard = await this.repo.get();
    return clipboard ?? EMPTY_CLIPBOARD;
  }

  async update(content: string): Promise<SharedClipboard> {
    const updated = await this.repo.update(content);
    this.logger.log(`Shared clipboard updated (${content.length} chars)`);
    return updated;
  }
}
