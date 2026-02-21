import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsRepository, type ComplianceReportRow, type ReadinessRow } from './documents.repository';
import type { FileStorageService } from './file-storage.service';
import type { TaxDocument } from '@contractor-os/shared';
import { TaxDocumentType, IRS_1099_THRESHOLD } from '@contractor-os/shared';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

const CONTRACTOR_ID = 'contractor-1';
const OTHER_CONTRACTOR_ID = 'contractor-2';
const CONTRACTOR_USER_ID = 'user-contractor-1';
const ORG_ID = 'org-1';
const ADMIN_USER_ID = 'admin-1';
const DOC_ID = 'doc-1';

function makeDocument(overrides: Partial<TaxDocument> = {}): TaxDocument {
  return {
    id: DOC_ID,
    contractorId: CONTRACTOR_ID,
    organizationId: ORG_ID,
    documentType: TaxDocumentType.W9,
    filePath: 'org-1/contractor-1/abc-w9.pdf',
    fileName: 'w9.pdf',
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    uploadedBy: ADMIN_USER_ID,
    expiresAt: null,
    tinLastFour: null,
    isCurrent: true,
    version: 1,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeUser(role: string, sub: string = CONTRACTOR_USER_ID): JwtPayload {
  return { sub, orgId: ORG_ID, role };
}

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'w9.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test'),
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
    ...overrides,
  };
}

function createMockRepo(): jest.Mocked<DocumentsRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByContractorId: jest.fn(),
    softDelete: jest.fn(),
    getComplianceReport: jest.fn(),
    get1099Readiness: jest.fn(),
    findContractorByUserId: jest.fn(),
  } as unknown as jest.Mocked<DocumentsRepository>;
}

function createMockStorage(): jest.Mocked<FileStorageService> {
  return {
    save: jest.fn(),
    read: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
  };
}

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repo: jest.Mocked<DocumentsRepository>;
  let storage: jest.Mocked<FileStorageService>;

  beforeEach(() => {
    repo = createMockRepo();
    storage = createMockStorage();
    service = new DocumentsService(repo, storage);
    jest.clearAllMocks();

    repo.findContractorByUserId.mockResolvedValue({
      id: CONTRACTOR_ID,
      organizationId: ORG_ID,
    });
  });

  // ─── UPLOAD ───────────────────────────────────────────────────

  describe('upload', () => {
    const input = { type: TaxDocumentType.W9 };

    it('should upload a document successfully', async () => {
      const doc = makeDocument();
      storage.save.mockResolvedValue('org-1/contractor-1/abc-w9.pdf');
      repo.create.mockResolvedValue(doc);

      const result = await service.upload(
        CONTRACTOR_ID,
        makeUser('admin', ADMIN_USER_ID),
        makeFile(),
        input,
      );

      expect(result).toEqual(doc);
      expect(storage.save).toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalled();
    });

    it('should allow contractor to upload for themselves', async () => {
      const doc = makeDocument();
      storage.save.mockResolvedValue('path');
      repo.create.mockResolvedValue(doc);

      const result = await service.upload(
        CONTRACTOR_ID,
        makeUser('contractor'),
        makeFile(),
        input,
      );

      expect(result).toEqual(doc);
    });

    it('should reject contractor uploading for another', async () => {
      await expect(
        service.upload(
          OTHER_CONTRACTOR_ID,
          makeUser('contractor'),
          makeFile(),
          input,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject missing file', async () => {
      await expect(
        service.upload(
          CONTRACTOR_ID,
          makeUser('admin', ADMIN_USER_ID),
          null as unknown as Express.Multer.File,
          input,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject file exceeding 10MB', async () => {
      await expect(
        service.upload(
          CONTRACTOR_ID,
          makeUser('admin', ADMIN_USER_ID),
          makeFile({ size: 11 * 1024 * 1024 }),
          input,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject disallowed MIME type', async () => {
      await expect(
        service.upload(
          CONTRACTOR_ID,
          makeUser('admin', ADMIN_USER_ID),
          makeFile({ mimetype: 'application/zip' }),
          input,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow admin to upload for any contractor', async () => {
      const doc = makeDocument({ contractorId: OTHER_CONTRACTOR_ID });
      storage.save.mockResolvedValue('path');
      repo.create.mockResolvedValue(doc);

      const result = await service.upload(
        OTHER_CONTRACTOR_ID,
        makeUser('admin', ADMIN_USER_ID),
        makeFile(),
        input,
      );

      expect(result).toEqual(doc);
    });
  });

  // ─── FIND BY CONTRACTOR ID ───────────────────────────────────

  describe('findByContractorId', () => {
    const query = { page: 1, pageSize: 20 };

    it('should return paginated documents', async () => {
      const docs = [makeDocument()];
      repo.findByContractorId.mockResolvedValue({ items: docs, total: 1 });

      const result = await service.findByContractorId(
        CONTRACTOR_ID,
        makeUser('admin', ADMIN_USER_ID),
        query,
      );

      expect(result.items).toEqual(docs);
      expect(result.meta.total).toBe(1);
    });

    it('should allow contractor to view own documents', async () => {
      repo.findByContractorId.mockResolvedValue({ items: [], total: 0 });

      const result = await service.findByContractorId(
        CONTRACTOR_ID,
        makeUser('contractor'),
        query,
      );

      expect(result.items).toEqual([]);
    });

    it('should reject contractor viewing other documents', async () => {
      await expect(
        service.findByContractorId(
          OTHER_CONTRACTOR_ID,
          makeUser('contractor'),
          query,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── FIND BY ID ──────────────────────────────────────────────

  describe('findById', () => {
    it('should return document by id', async () => {
      const doc = makeDocument();
      repo.findById.mockResolvedValue(doc);

      const result = await service.findById(DOC_ID, makeUser('admin', ADMIN_USER_ID));
      expect(result).toEqual(doc);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.findById('nonexistent', makeUser('admin', ADMIN_USER_ID)),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject contractor accessing other documents', async () => {
      repo.findById.mockResolvedValue(makeDocument({ contractorId: OTHER_CONTRACTOR_ID }));

      await expect(
        service.findById(DOC_ID, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── DOWNLOAD ────────────────────────────────────────────────

  describe('download', () => {
    it('should return buffer and document', async () => {
      const doc = makeDocument();
      const buf = Buffer.from('file-content');
      repo.findById.mockResolvedValue(doc);
      storage.read.mockResolvedValue(buf);

      const result = await service.download(DOC_ID, makeUser('admin', ADMIN_USER_ID));
      expect(result.buffer).toEqual(buf);
      expect(result.document).toEqual(doc);
    });

    it('should throw NotFoundException when document not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.download('nonexistent', makeUser('admin', ADMIN_USER_ID)),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject contractor downloading other documents', async () => {
      repo.findById.mockResolvedValue(makeDocument({ contractorId: OTHER_CONTRACTOR_ID }));

      await expect(
        service.download(DOC_ID, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── SOFT DELETE ─────────────────────────────────────────────

  describe('softDelete', () => {
    it('should soft-delete document for admin', async () => {
      repo.findById.mockResolvedValue(makeDocument());
      repo.softDelete.mockResolvedValue(true);

      await service.softDelete(DOC_ID, makeUser('admin', ADMIN_USER_ID));
      expect(repo.softDelete).toHaveBeenCalledWith(DOC_ID);
    });

    it('should throw NotFoundException when document not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.softDelete('nonexistent', makeUser('admin', ADMIN_USER_ID)),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject non-admin from deleting', async () => {
      await expect(
        service.softDelete(DOC_ID, makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject manager from deleting', async () => {
      await expect(
        service.softDelete(DOC_ID, makeUser('manager')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── COMPLIANCE REPORT ───────────────────────────────────────

  describe('getComplianceReport', () => {
    const domesticRow: ComplianceReportRow = {
      contractor_id: CONTRACTOR_ID,
      contractor_name: 'John Smith',
      contractor_type: 'domestic',
      current_doc_types: 'w9,contract',
      expiring_types: null,
      expiring_dates: null,
    };

    const nonCompliantRow: ComplianceReportRow = {
      contractor_id: OTHER_CONTRACTOR_ID,
      contractor_name: 'Maria Garcia',
      contractor_type: 'domestic',
      current_doc_types: 'w9',
      expiring_types: 'w9',
      expiring_dates: 'w9:2026-03-15',
    };

    const foreignRow: ComplianceReportRow = {
      contractor_id: 'contractor-3',
      contractor_name: 'Kenji Yamada',
      contractor_type: 'foreign',
      current_doc_types: 'w8ben,contract',
      expiring_types: null,
      expiring_dates: null,
    };

    it('should return compliance entries for all active contractors', async () => {
      repo.getComplianceReport.mockResolvedValue([domesticRow, nonCompliantRow]);

      const result = await service.getComplianceReport(makeUser('admin', ADMIN_USER_ID));
      expect(result).toHaveLength(2);
    });

    it('should compute correct required docs for domestic contractor', async () => {
      repo.getComplianceReport.mockResolvedValue([domesticRow]);

      const [entry] = await service.getComplianceReport(makeUser('admin', ADMIN_USER_ID));
      expect(entry!.requiredDocuments).toEqual(['w9', 'contract']);
    });

    it('should compute correct required docs for foreign contractor', async () => {
      repo.getComplianceReport.mockResolvedValue([foreignRow]);

      const [entry] = await service.getComplianceReport(makeUser('admin', ADMIN_USER_ID));
      expect(entry!.requiredDocuments).toEqual(['w8ben', 'contract']);
    });

    it('should mark contractor as compliant when all required docs present', async () => {
      repo.getComplianceReport.mockResolvedValue([domesticRow]);

      const [entry] = await service.getComplianceReport(makeUser('admin', ADMIN_USER_ID));
      expect(entry!.isCompliant).toBe(true);
      expect(entry!.missingDocuments).toEqual([]);
    });

    it('should identify missing documents', async () => {
      repo.getComplianceReport.mockResolvedValue([nonCompliantRow]);

      const [entry] = await service.getComplianceReport(makeUser('admin', ADMIN_USER_ID));
      expect(entry!.missingDocuments).toEqual(['contract']);
      expect(entry!.isCompliant).toBe(false);
    });

    it('should identify expiring documents', async () => {
      repo.getComplianceReport.mockResolvedValue([nonCompliantRow]);

      const [entry] = await service.getComplianceReport(makeUser('admin', ADMIN_USER_ID));
      expect(entry!.expiringDocuments).toEqual([
        { type: 'w9', expiresAt: '2026-03-15' },
      ]);
    });

    it('should reject non-admin/manager', async () => {
      await expect(
        service.getComplianceReport(makeUser('contractor')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow manager access', async () => {
      repo.getComplianceReport.mockResolvedValue([]);

      const result = await service.getComplianceReport(makeUser('manager', 'manager-1'));
      expect(result).toEqual([]);
    });
  });

  // ─── 1099 READINESS ──────────────────────────────────────────

  describe('get1099Readiness', () => {
    const aboveThresholdRow: ReadinessRow = {
      contractor_id: CONTRACTOR_ID,
      contractor_name: 'John Smith',
      ytd_payments: '750.00',
      has_current_w9: true,
      w9_expires_at: null,
    };

    const belowThresholdRow: ReadinessRow = {
      contractor_id: OTHER_CONTRACTOR_ID,
      contractor_name: 'Maria Garcia',
      ytd_payments: '500.00',
      has_current_w9: false,
      w9_expires_at: null,
    };

    const notReadyRow: ReadinessRow = {
      contractor_id: 'contractor-3',
      contractor_name: 'Bob Johnson',
      ytd_payments: '1200.00',
      has_current_w9: false,
      w9_expires_at: null,
    };

    it('should return domestic contractors', async () => {
      repo.get1099Readiness.mockResolvedValue([aboveThresholdRow, belowThresholdRow]);

      const result = await service.get1099Readiness(makeUser('admin', ADMIN_USER_ID), 2026);
      expect(result).toHaveLength(2);
    });

    it('should flag contractors at or above $600 threshold', async () => {
      repo.get1099Readiness.mockResolvedValue([aboveThresholdRow]);

      const [entry] = await service.get1099Readiness(makeUser('admin', ADMIN_USER_ID), 2026);
      expect(entry!.requires1099).toBe(true);
      expect(entry!.ytdPayments).toBe(750);
    });

    it('should not flag contractors below $600 threshold', async () => {
      repo.get1099Readiness.mockResolvedValue([belowThresholdRow]);

      const [entry] = await service.get1099Readiness(makeUser('admin', ADMIN_USER_ID), 2026);
      expect(entry!.requires1099).toBe(false);
    });

    it('should mark ready when requires 1099 and has current W-9', async () => {
      repo.get1099Readiness.mockResolvedValue([aboveThresholdRow]);

      const [entry] = await service.get1099Readiness(makeUser('admin', ADMIN_USER_ID), 2026);
      expect(entry!.isReady).toBe(true);
    });

    it('should mark not ready when requires 1099 but missing W-9', async () => {
      repo.get1099Readiness.mockResolvedValue([notReadyRow]);

      const [entry] = await service.get1099Readiness(makeUser('admin', ADMIN_USER_ID), 2026);
      expect(entry!.requires1099).toBe(true);
      expect(entry!.isReady).toBe(false);
    });

    it('should mark ready when below threshold regardless of W-9', async () => {
      repo.get1099Readiness.mockResolvedValue([belowThresholdRow]);

      const [entry] = await service.get1099Readiness(makeUser('admin', ADMIN_USER_ID), 2026);
      expect(entry!.isReady).toBe(true);
    });

    it('should pass year to repository', async () => {
      repo.get1099Readiness.mockResolvedValue([]);

      await service.get1099Readiness(makeUser('admin', ADMIN_USER_ID), 2025);
      expect(repo.get1099Readiness).toHaveBeenCalledWith(ORG_ID, 2025);
    });

    it('should reject non-admin/manager', async () => {
      await expect(
        service.get1099Readiness(makeUser('contractor'), 2026),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
