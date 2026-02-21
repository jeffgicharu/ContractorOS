import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  uploadDocumentSchema,
  documentListQuerySchema,
  type UploadDocumentInput,
  type DocumentListQuery,
  UserRole,
} from '@contractor-os/shared';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractorDocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type ${file.mimetype} is not allowed`), false);
        }
      },
    }),
  )
  async upload(
    @CurrentUser() user: JwtPayload,
    @Param('id') contractorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query(new ZodValidationPipe(uploadDocumentSchema)) query: UploadDocumentInput,
  ) {
    const result = await this.documentsService.upload(contractorId, user, file, query);
    return { data: result };
  }

  @Get(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async list(
    @CurrentUser() user: JwtPayload,
    @Param('id') contractorId: string,
    @Query(new ZodValidationPipe(documentListQuerySchema)) query: DocumentListQuery,
  ) {
    const { items, meta } = await this.documentsService.findByContractorId(contractorId, user, query);
    return { data: items, meta };
  }
}

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('compliance-report')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async complianceReport(@CurrentUser() user: JwtPayload) {
    const result = await this.documentsService.getComplianceReport(user);
    return { data: result };
  }

  @Get('1099-readiness')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async readiness1099(
    @CurrentUser() user: JwtPayload,
    @Query('year') yearStr?: string,
  ) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    const result = await this.documentsService.get1099Readiness(user, year);
    return { data: result };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.documentsService.findById(id, user);
    return { data: result };
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  async download(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, document } = await this.documentsService.download(id, user);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.fileName}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.documentsService.softDelete(id, user);
    return { data: { message: 'Document archived' } };
  }
}
