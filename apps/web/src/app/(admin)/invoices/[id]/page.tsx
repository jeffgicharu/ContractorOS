'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import { InvoiceTimeline } from '@/components/invoices/invoice-timeline';
import type { InvoiceDetail, InvoiceStatus } from '@contractor-os/shared';
import { useAuth } from '@/hooks/use-auth';

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);

  async function loadInvoice() {
    try {
      const { data } = await api.get<InvoiceDetail>(`/invoices/${params.id}`);
      setInvoice(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setError('Invoice not found');
      } else {
        setError('Failed to load invoice');
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  async function handleAction(action: string, body?: unknown) {
    setActionLoading(action);
    try {
      await api.post(`/invoices/${params.id}/${action}`, body);
      await loadInvoice();
    } catch {
      // Ignore
    } finally {
      setActionLoading('');
      setShowRejectModal(false);
      setShowDisputeModal(false);
      setShowScheduleModal(false);
      setShowPaidModal(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-500">{error || 'Invoice not found'}</p>
        <Link href="/invoices" className="mt-4 inline-block text-sm text-brand-500 hover:text-brand-600">
          Back to invoices
        </Link>
      </div>
    );
  }

  const actions = invoice.actions;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-[13px] text-slate-400">
        <Link href="/invoices" className="hover:text-slate-600">Invoices</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">{invoice.invoiceNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-mono text-slate-900">
              {invoice.invoiceNumber}
            </h1>
            <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {invoice.contractor.name} · {invoice.engagement.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {actions.includes('approve') && (
            <Button
              size="sm"
              onClick={() => handleAction('approve')}
              isLoading={actionLoading === 'approve'}
            >
              Approve
            </Button>
          )}
          {actions.includes('reject') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRejectModal(true)}
            >
              Reject
            </Button>
          )}
          {isAdmin && actions.includes('schedule') && (
            <Button
              size="sm"
              onClick={() => setShowScheduleModal(true)}
            >
              Schedule Payment
            </Button>
          )}
          {isAdmin && actions.includes('mark_paid') && (
            <Button
              size="sm"
              onClick={() => setShowPaidModal(true)}
            >
              Mark Paid
            </Button>
          )}
          {actions.includes('dispute') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDisputeModal(true)}
            >
              Dispute
            </Button>
          )}
          {isAdmin && actions.includes('cancel') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('cancel')}
              isLoading={actionLoading === 'cancel'}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Details</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Period</dt>
              <dd className="text-sm text-slate-900">
                {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Due Date</dt>
              <dd className="text-sm text-slate-900">{formatDate(invoice.dueDate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Submitted</dt>
              <dd className="text-sm text-slate-900">{formatDate(invoice.submittedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Approved</dt>
              <dd className="text-sm text-slate-900">{formatDate(invoice.approvedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Paid</dt>
              <dd className="text-sm text-slate-900">{formatDate(invoice.paidAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Amounts</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Subtotal</dt>
              <dd className="text-sm font-mono text-slate-900">{formatCurrency(invoice.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-slate-500">Tax</dt>
              <dd className="text-sm font-mono text-slate-900">{formatCurrency(invoice.taxAmount)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <dt className="text-sm font-semibold text-slate-900">Total</dt>
              <dd className="text-base font-bold font-mono text-slate-900">{formatCurrency(invoice.totalAmount)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Approval</h3>
          <div className="mt-4 space-y-3">
            {invoice.approvalSteps.length === 0 ? (
              <p className="text-sm text-slate-400">No approval steps yet.</p>
            ) : (
              invoice.approvalSteps.map((step) => (
                <div key={step.id} className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-600">
                    {step.approverName ?? step.approverId}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      step.decision === 'approved'
                        ? 'text-success-700'
                        : step.decision === 'rejected'
                          ? 'text-error-700'
                          : 'text-warning-600'
                    }`}
                  >
                    {step.decision}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="text-base font-semibold text-slate-900">Line Items</h3>
        </div>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400 hidden sm:table-cell">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400 hidden sm:table-cell">
                Unit Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-slate-400">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-slate-50">
                <td className="px-6 py-3 text-[13px] text-slate-700">{item.description}</td>
                <td className="px-4 py-3 text-right text-[13px] font-mono text-slate-700 hidden sm:table-cell">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right text-[13px] font-mono text-slate-700 hidden sm:table-cell">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-6 py-3 text-right text-[13px] font-mono font-medium text-slate-900">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Notes</h3>
          <p className="mt-2 text-[13px] text-slate-600">{invoice.notes}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Status History</h3>
        <div className="mt-4">
          <InvoiceTimeline history={invoice.statusHistory} />
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal onClose={() => setShowRejectModal(false)}>
          <h3 className="text-lg font-semibold text-slate-900">Reject Invoice</h3>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={3}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('reject', { reason: rejectReason })}
              isLoading={actionLoading === 'reject'}
              disabled={!rejectReason.trim()}
            >
              Reject
            </Button>
          </div>
        </Modal>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <Modal onClose={() => setShowDisputeModal(false)}>
          <h3 className="text-lg font-semibold text-slate-900">Dispute Invoice</h3>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Reason for dispute..."
            className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={3}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDisputeModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction('dispute', { reason: disputeReason })}
              isLoading={actionLoading === 'dispute'}
              disabled={!disputeReason.trim()}
            >
              Dispute
            </Button>
          </div>
        </Modal>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <Modal onClose={() => setShowScheduleModal(false)}>
          <h3 className="text-lg font-semibold text-slate-900">Schedule Payment</h3>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Payment Date
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction('schedule', { paymentDate })}
              isLoading={actionLoading === 'schedule'}
              disabled={!paymentDate}
            >
              Schedule
            </Button>
          </div>
        </Modal>
      )}

      {/* Mark Paid Modal */}
      {showPaidModal && (
        <Modal onClose={() => setShowPaidModal(false)}>
          <h3 className="text-lg font-semibold text-slate-900">Mark as Paid</h3>
          <p className="mt-2 text-sm text-slate-500">
            Confirm that this invoice has been paid.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowPaidModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction('mark-paid', { paidAt: new Date().toISOString() })}
              isLoading={actionLoading === 'mark-paid'}
            >
              Confirm Paid
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        {children}
      </div>
    </div>
  );
}
