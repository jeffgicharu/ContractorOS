'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { DocumentStatusBadge, getDocumentStatus } from '@/components/documents/document-status-badge';
import { UploadModal } from '@/components/documents/upload-modal';
import {
  DOCUMENT_TYPE_LABELS,
  REQUIRED_DOCUMENTS_DOMESTIC,
  type TaxDocumentType,
  type TaxDocument,
  type ContractorDetail,
} from '@contractor-os/shared';

export default function PortalDocumentsPage() {
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const loadDocuments = useCallback(async (cId: string) => {
    try {
      const { data } = await api.get<TaxDocument[]>(`/contractors/${cId}/documents`, {
        pageSize: 50,
      });
      setDocuments(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const { data: me } = await api.get<ContractorDetail>('/contractors/me');
        setContractorId(me.id);
        await loadDocuments(me.id);
      } catch {
        setIsLoading(false);
      }
    }
    init();
  }, [loadDocuments]);

  async function handleDownload(doc: TaxDocument) {
    try {
      const { blob, fileName } = await api.download(`/documents/${doc.id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }

  // Compute missing required documents
  const currentTypes = documents
    .filter((d) => d.isCurrent)
    .map((d) => d.documentType);
  const missingDocs = REQUIRED_DOCUMENTS_DOMESTIC.filter(
    (req) => !currentTypes.includes(req),
  );
  const expiredDocs = documents.filter(
    (d) => d.isCurrent && d.expiresAt && new Date(d.expiresAt) <= new Date(),
  );
  const expiringDocs = documents.filter((d) => {
    if (!d.isCurrent || !d.expiresAt) return false;
    const expiry = new Date(d.expiresAt);
    const now = new Date();
    if (expiry <= now) return false;
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDays;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Documents
        </h1>
        {contractorId && (
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Upload Document
          </button>
        )}
      </div>

      {/* Alert banners */}
      {missingDocs.length > 0 && (
        <div className="mt-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3">
          <p className="text-sm font-medium text-error-800">
            Missing required documents:{' '}
            {missingDocs.map((t) => DOCUMENT_TYPE_LABELS[t]).join(', ')}
          </p>
          <p className="text-xs text-error-600 mt-1">
            Please upload these documents to remain compliant.
          </p>
        </div>
      )}

      {(expiredDocs.length > 0 || expiringDocs.length > 0) && (
        <div className="mt-3 rounded-lg bg-warning-50 border border-warning-200 px-4 py-3">
          {expiredDocs.length > 0 && (
            <p className="text-sm font-medium text-warning-800">
              Expired documents:{' '}
              {expiredDocs.map((d) => DOCUMENT_TYPE_LABELS[d.documentType as TaxDocumentType] ?? d.documentType).join(', ')}
            </p>
          )}
          {expiringDocs.length > 0 && (
            <p className="text-sm font-medium text-warning-800">
              Expiring soon:{' '}
              {expiringDocs.map((d) => DOCUMENT_TYPE_LABELS[d.documentType as TaxDocumentType] ?? d.documentType).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Documents table */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        {documents.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-500">No documents uploaded yet.</p>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Type
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  File Name
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Status
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Uploaded
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Expires
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="h-12 border-b border-slate-50">
                  <td className="px-4 text-[13px] font-medium text-slate-900">
                    {DOCUMENT_TYPE_LABELS[doc.documentType as TaxDocumentType] ?? doc.documentType}
                  </td>
                  <td className="px-4 text-[13px] text-slate-700 max-w-[200px] truncate">
                    {doc.fileName}
                  </td>
                  <td className="px-4">
                    <DocumentStatusBadge status={getDocumentStatus(doc)} />
                  </td>
                  <td className="px-4 text-[13px] text-slate-600">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-4 text-[13px] text-slate-600">
                    {formatDate(doc.expiresAt)}
                  </td>
                  <td className="px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showUpload && contractorId && (
        <UploadModal
          contractorId={contractorId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            setIsLoading(true);
            loadDocuments(contractorId);
          }}
        />
      )}
    </div>
  );
}
