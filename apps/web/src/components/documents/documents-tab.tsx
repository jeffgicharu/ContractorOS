'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { DocumentStatusBadge, getDocumentStatus } from './document-status-badge';
import { UploadModal } from './upload-modal';
import { DOCUMENT_TYPE_LABELS, type TaxDocumentType, type TaxDocument } from '@contractor-os/shared';

interface DocumentsTabProps {
  contractorId: string;
}

export function DocumentsTab({ contractorId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const { data } = await api.get<TaxDocument[]>(`/contractors/${contractorId}/documents`, {
        pageSize: 50,
      });
      setDocuments(data);
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  }, [contractorId]);

  useEffect(() => {
    loadDocuments();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Documents</h3>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Upload Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">No documents uploaded for this contractor.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                  Type
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                  File Name
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                  Status
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                  Uploaded
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                  Expires
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="h-12 border-b border-slate-100">
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
        </div>
      )}

      {showUpload && (
        <UploadModal
          contractorId={contractorId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            setIsLoading(true);
            loadDocuments();
          }}
        />
      )}
    </div>
  );
}
