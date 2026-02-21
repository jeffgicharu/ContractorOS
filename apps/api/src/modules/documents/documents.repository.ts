import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { TaxDocument, DocumentListQuery } from '@contractor-os/shared';
import type { TaxDocumentType } from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';
import { paginationToOffset } from '../../common/pagination/paginate';

interface TaxDocumentRow {
  id: string;
  contractor_id: string;
  organization_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_by: string;
  expires_at: string | null;
  tin_last_four: string | null;
  is_current: boolean;
  version: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapDocumentRow(row: TaxDocumentRow): TaxDocument {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    organizationId: row.organization_id,
    documentType: row.document_type as TaxDocumentType,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    expiresAt: row.expires_at,
    tinLastFour: row.tin_last_four,
    isCurrent: row.is_current,
    version: row.version,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateDocumentInput {
  contractorId: string;
  organizationId: string;
  documentType: TaxDocumentType;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  expiresAt?: string;
  tinLastFour?: string;
  notes?: string;
}

export interface ComplianceReportRow {
  contractor_id: string;
  contractor_name: string;
  contractor_type: string;
  current_doc_types: string | null;
  expiring_types: string | null;
  expiring_dates: string | null;
}

export interface ReadinessRow {
  contractor_id: string;
  contractor_name: string;
  ytd_payments: string;
  has_current_w9: boolean;
  w9_expires_at: string | null;
}

@Injectable()
export class DocumentsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(input: CreateDocumentInput): Promise<TaxDocument> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Mark previous versions of same type as not current
      await client.query(
        `UPDATE tax_documents
         SET is_current = false
         WHERE contractor_id = $1 AND document_type = $2::tax_document_type AND is_current = true`,
        [input.contractorId, input.documentType],
      );

      // Get latest version number
      const { rows: versionRows } = await client.query<{ max_version: number }>(
        `SELECT COALESCE(MAX(version), 0) as max_version
         FROM tax_documents
         WHERE contractor_id = $1 AND document_type = $2::tax_document_type`,
        [input.contractorId, input.documentType],
      );
      const nextVersion = (versionRows[0]?.max_version ?? 0) + 1;

      const { rows } = await client.query<TaxDocumentRow>(
        `INSERT INTO tax_documents (
          contractor_id, organization_id, document_type, file_path, file_name,
          file_size_bytes, mime_type, uploaded_by, expires_at, tin_last_four, notes, version
        ) VALUES ($1, $2, $3::tax_document_type, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          input.contractorId,
          input.organizationId,
          input.documentType,
          input.filePath,
          input.fileName,
          input.fileSizeBytes,
          input.mimeType,
          input.uploadedBy,
          input.expiresAt ?? null,
          input.tinLastFour ?? null,
          input.notes ?? null,
          nextVersion,
        ],
      );

      await client.query('COMMIT');
      return mapDocumentRow(rows[0]!);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<TaxDocument | null> {
    const { rows } = await this.pool.query<TaxDocumentRow>(
      'SELECT * FROM tax_documents WHERE id = $1',
      [id],
    );
    return rows[0] ? mapDocumentRow(rows[0]) : null;
  }

  async findByContractorId(
    contractorId: string,
    orgId: string,
    query: DocumentListQuery,
  ): Promise<{ items: TaxDocument[]; total: number }> {
    const { limit, offset } = paginationToOffset({ page: query.page, pageSize: query.pageSize });
    const conditions: string[] = ['contractor_id = $1', 'organization_id = $2'];
    const params: unknown[] = [contractorId, orgId];
    let paramIdx = 3;

    if (query.type) {
      conditions.push(`document_type = $${paramIdx}::tax_document_type`);
      params.push(query.type);
      paramIdx++;
    }

    if (query.isCurrent !== undefined) {
      conditions.push(`is_current = $${paramIdx}`);
      params.push(query.isCurrent);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const { rows: countRows } = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) as total FROM tax_documents WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countRows[0]!.total, 10);

    const { rows } = await this.pool.query<TaxDocumentRow>(
      `SELECT * FROM tax_documents
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset],
    );

    return { items: rows.map(mapDocumentRow), total };
  }

  async softDelete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'UPDATE tax_documents SET is_current = false WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  async getComplianceReport(orgId: string): Promise<ComplianceReportRow[]> {
    const { rows } = await this.pool.query<ComplianceReportRow>(
      `SELECT
        c.id as contractor_id,
        c.first_name || ' ' || c.last_name as contractor_name,
        c.type as contractor_type,
        STRING_AGG(DISTINCT CASE WHEN d.is_current = true THEN d.document_type::text END, ',') as current_doc_types,
        STRING_AGG(DISTINCT CASE WHEN d.is_current = true AND d.expires_at IS NOT NULL AND d.expires_at <= NOW() + INTERVAL '30 days' THEN d.document_type::text END, ',') as expiring_types,
        STRING_AGG(DISTINCT CASE WHEN d.is_current = true AND d.expires_at IS NOT NULL AND d.expires_at <= NOW() + INTERVAL '30 days' THEN d.document_type::text || ':' || d.expires_at::text END, ',') as expiring_dates
      FROM contractors c
      LEFT JOIN tax_documents d ON d.contractor_id = c.id AND d.organization_id = $1
      WHERE c.organization_id = $1 AND c.status != 'offboarded'
      GROUP BY c.id, c.first_name, c.last_name, c.type
      ORDER BY c.last_name, c.first_name`,
      [orgId],
    );
    return rows;
  }

  async get1099Readiness(orgId: string, year: number): Promise<ReadinessRow[]> {
    const { rows } = await this.pool.query<ReadinessRow>(
      `SELECT
        c.id as contractor_id,
        c.first_name || ' ' || c.last_name as contractor_name,
        COALESCE(SUM(CASE WHEN i.status = 'paid' AND EXTRACT(YEAR FROM i.paid_at) = $2 THEN i.total_amount ELSE 0 END), 0) as ytd_payments,
        EXISTS(
          SELECT 1 FROM tax_documents d
          WHERE d.contractor_id = c.id AND d.document_type = 'w9' AND d.is_current = true
        ) as has_current_w9,
        (
          SELECT d.expires_at FROM tax_documents d
          WHERE d.contractor_id = c.id AND d.document_type = 'w9' AND d.is_current = true
          LIMIT 1
        ) as w9_expires_at
      FROM contractors c
      LEFT JOIN invoices i ON i.contractor_id = c.id AND i.organization_id = $1
      WHERE c.organization_id = $1 AND c.type = 'domestic' AND c.status != 'offboarded'
      GROUP BY c.id, c.first_name, c.last_name
      ORDER BY c.last_name, c.first_name`,
      [orgId, year],
    );
    return rows;
  }

  async findContractorByUserId(userId: string): Promise<{ id: string; organizationId: string } | null> {
    const { rows } = await this.pool.query<{ id: string; organization_id: string }>(
      'SELECT id, organization_id FROM contractors WHERE user_id = $1',
      [userId],
    );
    return rows[0] ? { id: rows[0].id, organizationId: rows[0].organization_id } : null;
  }
}
