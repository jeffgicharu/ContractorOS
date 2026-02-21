import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileStorageService } from './file-storage.service';

@Injectable()
export class LocalFileStorageService implements FileStorageService {
  private readonly logger = new Logger(LocalFileStorageService.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'uploads', 'documents');
  }

  async save(
    orgId: string,
    contractorId: string,
    fileId: string,
    fileName: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = path.join(this.baseDir, orgId, contractorId);
    await fs.mkdir(dir, { recursive: true });

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fullPath = path.join(dir, `${fileId}-${safeName}`);
    await fs.writeFile(fullPath, buffer);

    // Return relative path from baseDir for storage in DB
    const relativePath = path.relative(this.baseDir, fullPath);
    this.logger.log(`Saved file: ${relativePath} (${buffer.length} bytes)`);
    return relativePath;
  }

  async read(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      return await fs.readFile(fullPath);
    } catch {
      throw new NotFoundException(`File not found: ${filePath}`);
    }
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      await fs.unlink(fullPath);
      this.logger.log(`Deleted file: ${filePath}`);
    } catch {
      this.logger.warn(`File not found for deletion: ${filePath}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
