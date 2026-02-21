import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  TaxDocument,
  ComplianceReportEntry,
  ReadinessEntry1099,
  DocumentListQuery,
  PaginationMeta,
  UploadDocumentInput,
} from '@contractor-os/shared';
import {
  REQUIRED_DOCUMENTS_DOMESTIC,
  REQUIRED_DOCUMENTS_FOREIGN,
  IRS_1099_THRESHOLD,
  UserRole,
} from '@contractor-os/shared';
import type { TaxDocumentType } from '@contractor-os/shared';
import { DocumentsRepository } from './documents.repository';
import { FILE_STORAGE_SERVICE, type FileStorageService } from './file-storage.service';
import { buildPaginationMeta } from '../../common/pagination/paginate';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly repo: DocumentsRepository,
    @Inject(FILE_STORAGE_SERVICE) private readonly storage: FileStorageService,
  ) {}

  async upload(
    contractorId: string,
    user: JwtPayload,
    file: Express.Multer.File,
    input: UploadDocumentInput,
  ): Promise<TaxDocument> {
    // Contractors can only upload for themselves
    if (user.role === UserRole.CONTRACTOR) {
      const myId = await this.resolveContractorId(user);
      if (myId !== contractorId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You can only upload documents for yourself',
        });
      }
    }

    // Validate file
    if (!file) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'File is required',
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'File size exceeds 10MB limit',
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: `File type ${file.mimetype} is not allowed. Allowed: pdf, png, jpg, doc, docx`,
      });
    }

    // Save file to storage
    const fileId = randomUUID();
    const filePath = await this.storage.save(
      user.orgId,
      contractorId,
      fileId,
      file.originalname,
      file.buffer,
    );

    // Create DB record
    const document = await this.repo.create({
      contractorId,
      organizationId: user.orgId,
      documentType: input.type,
      filePath,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      mimeType: file.mimetype,
      uploadedBy: user.sub,
      expiresAt: input.expiresAt,
      notes: input.notes,
    });

    this.logger.log(`Document uploaded: ${document.id} (${input.type}) for contractor ${contractorId}`);
    return document;
  }

  async findByContractorId(
    contractorId: string,
    user: JwtPayload,
    query: DocumentListQuery,
  ): Promise<{ items: TaxDocument[]; meta: PaginationMeta }> {
    if (user.role === UserRole.CONTRACTOR) {
      const myId = await this.resolveContractorId(user);
      if (myId !== contractorId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You can only view your own documents',
        });
      }
    }

    const { items, total } = await this.repo.findByContractorId(contractorId, user.orgId, query);
    const meta = buildPaginationMeta({ page: query.page, pageSize: query.pageSize }, total);

    return { items, meta };
  }

  async findById(id: string, user: JwtPayload): Promise<TaxDocument> {
    const document = await this.repo.findById(id);
    if (!document) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Document ${id} not found`,
      });
    }

    await this.assertDocumentAccess(document, user);
    return document;
  }

  async download(id: string, user: JwtPayload): Promise<{ buffer: Buffer; document: TaxDocument }> {
    const document = await this.repo.findById(id);
    if (!document) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Document ${id} not found`,
      });
    }

    await this.assertDocumentAccess(document, user);

    const buffer = await this.storage.read(document.filePath);
    return { buffer, document };
  }

  async softDelete(id: string, user: JwtPayload): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only admins can delete documents',
      });
    }

    const document = await this.repo.findById(id);
    if (!document) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Document ${id} not found`,
      });
    }

    await this.repo.softDelete(id);
    this.logger.log(`Document soft-deleted: ${id}`);
  }

  async getComplianceReport(user: JwtPayload): Promise<ComplianceReportEntry[]> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only admins and managers can view compliance reports',
      });
    }

    const rows = await this.repo.getComplianceReport(user.orgId);

    return rows.map((row) => {
      const contractorType = row.contractor_type;
      const requiredDocuments: TaxDocumentType[] =
        contractorType === 'foreign'
          ? [...REQUIRED_DOCUMENTS_FOREIGN]
          : [...REQUIRED_DOCUMENTS_DOMESTIC];

      const currentDocuments: TaxDocumentType[] = row.current_doc_types
        ? (row.current_doc_types.split(',') as TaxDocumentType[])
        : [];

      const missingDocuments = requiredDocuments.filter(
        (req) => !currentDocuments.includes(req),
      );

      const expiringDocuments: { type: TaxDocumentType; expiresAt: string }[] = [];
      if (row.expiring_dates) {
        for (const entry of row.expiring_dates.split(',')) {
          const [type, expiresAt] = entry.split(':');
          if (type && expiresAt) {
            expiringDocuments.push({
              type: type as TaxDocumentType,
              expiresAt,
            });
          }
        }
      }

      return {
        contractorId: row.contractor_id,
        contractorName: row.contractor_name,
        contractorType,
        requiredDocuments,
        currentDocuments,
        missingDocuments,
        expiringDocuments,
        isCompliant: missingDocuments.length === 0,
      };
    });
  }

  async get1099Readiness(user: JwtPayload, year: number): Promise<ReadinessEntry1099[]> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only admins and managers can view 1099 readiness',
      });
    }

    const rows = await this.repo.get1099Readiness(user.orgId, year);

    return rows.map((row) => {
      const ytdPayments = parseFloat(row.ytd_payments);
      const requires1099 = ytdPayments >= IRS_1099_THRESHOLD;
      const isReady = requires1099 ? row.has_current_w9 : true;

      return {
        contractorId: row.contractor_id,
        contractorName: row.contractor_name,
        ytdPayments,
        hasCurrentW9: row.has_current_w9,
        w9ExpiresAt: row.w9_expires_at,
        requires1099,
        isReady,
      };
    });
  }

  private async resolveContractorId(user: JwtPayload): Promise<string> {
    const contractor = await this.repo.findContractorByUserId(user.sub);
    if (!contractor) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Contractor profile not found for current user',
      });
    }
    return contractor.id;
  }

  private async assertDocumentAccess(document: TaxDocument, user: JwtPayload): Promise<void> {
    if (user.role === UserRole.CONTRACTOR) {
      const myId = await this.resolveContractorId(user);
      if (document.contractorId !== myId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You can only access your own documents',
        });
      }
    }
  }
}
