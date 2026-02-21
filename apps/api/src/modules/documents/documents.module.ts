import { Module } from '@nestjs/common';
import { ContractorDocumentsController, DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { FILE_STORAGE_SERVICE } from './file-storage.service';
import { LocalFileStorageService } from './local-file-storage.service';

@Module({
  controllers: [ContractorDocumentsController, DocumentsController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    {
      provide: FILE_STORAGE_SERVICE,
      useClass: LocalFileStorageService,
    },
  ],
  exports: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}
