
import { useEffect, useState } from 'react';
import { fetchMemberInvoice, updateInvoiceSummary, downloadInvoicePdf, type InvoiceData } from '../api/invoices';
import { fetchMemberAssignments } from '../api/members';
import { useToast } from '../context/ToastContext';
import type { Member, PlanAssignmentHistoryItem, PlanType } from '../types';

interface Props {
  open: boolean;
  member: Member | null;
  onClose: () => void;
}

export default function InvoiceModal({ open, member, onClose }: Props) {
  const { showToast } = useToast();
  const [planTypeTab, setPlanTypeTab] = useState<PlanType>('membership');
  const [tab, setTab] = useState<'summary' | 'invoice'>('summary');
  const [latestByType, setLatestByType] = useState<Partial<Record<PlanType, PlanAssignmentHistoryItem>>>({});
  const [data, setData] = useState<InvoiceData | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Step 1: on open, find the most recent assignment of each type so we
  // know which tabs have data and which assignmentId to fetch invoices for.
  useEffect(() => {
    if (!open || !member) return;
    setData(null);
    setLatestByType({});
    fetchMemberAssignments(member.id).then((items) => {
      const latest: Partial<Record<PlanType, PlanAssignmentHistoryItem>> = {};
      for (const a of items) {
        if (!latest[a.planType]) latest[a.planType] = a; // items are already sorted newest-first
      }
      setLatestByType(latest);
      setPlanTypeTab(latest.membership ? 'membership' : latest.personal_training ? 'personal_training' : 'membership');
    }).catch(() => {});
    setTab('summary');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  // Step 2: whenever the selected type-tab (or the underlying assignment map)
  // changes, load the invoice for that specific assignment.
  useEffect(() => {
    if (!open || !member) return;
    const fallbackTab = latestByType.membership ? 'membership' : latestByType.personal_training ? 'personal_training' : undefined;
    const selectedTab = latestByType[planTypeTab] ? planTypeTab : fallbackTab;
    if (!selectedTab) {
      setData(null);
      setLoading(false);
      return;
    }
    if (selectedTab !== planTypeTab) {
      setPlanTypeTab(selectedTab);
      return;
    }
    const target = latestByType[selectedTab];
    if (!target) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMemberInvoice(member.id, target.id)
      .then((res) => {
        setData(res);
        setDraft(res.summaryMessage);
      })
      .catch(() => showToast('Could not load this invoice.', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member, planTypeTab, latestByType]);

  if (!open || !member) return null;

  const hasMembership = !!latestByType.membership;
  const hasPT = !!latestByType.personal_training;

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updateInvoiceSummary(member.id, data.assignmentId, draft);
      showToast('Summary saved.', 'success');
    } catch {
      showToast('Could not save summary.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!member || !data) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(member.id, data.invoiceNumber, data.assignmentId);
    } catch {
      showToast('Could not download invoice PDF.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{member.fullName}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {(hasMembership && hasPT) && (
          <div className="flex gap-2 mb-3">
            <button type="button" className={planTypeTab === 'membership' ? 'btn-primary' : 'btn-secondary'} style={{ width: 'auto' }} onClick={() => setPlanTypeTab('membership')}>Membership</button>
            <button type="button" className={planTypeTab === 'personal_training' ? 'btn-primary' : 'btn-secondary'} style={{ width: 'auto' }} onClick={() => setPlanTypeTab('personal_training')}>Personal Training</button>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={tab === 'summary' ? 'btn-primary' : 'btn-secondary'}
            style={{ width: 'auto' }}
            onClick={() => setTab('summary')}
          >
            Summary
          </button>
          <button
            type="button"
            className={tab === 'invoice' ? 'btn-primary' : 'btn-secondary'}
            style={{ width: 'auto' }}
            onClick={() => setTab('invoice')}
          >
            Invoice
          </button>
        </div>

        {loading ? (
          <div className="skeleton h-40" />
        ) : !data ? (
          <p style={{ color: 'var(--text-muted)' }}>
            No paid {planTypeTab === 'personal_training' ? 'personal training package' : 'plan'} found for this member yet.
          </p>
        ) : tab === 'summary' ? (
          <div className="space-y-3">
            <textarea
              className="input-field"
              rows={8}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-5" style={{ borderColor: 'var(--surface-2)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {data.gym.logoUrl && (
                    <img src={data.gym.logoUrl} alt="" className="w-12 h-12 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-display text-lg">{data.gym.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {data.gym.address}, {data.gym.city}, {data.gym.state} {data.gym.pincode}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {data.gym.mobile} · {data.gym.email}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>{data.invoiceNumber}</p>
                  <p>{new Date(data.issueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="label-eyebrow">Billed to</p>
                <p className="font-medium">{data.member.fullName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.member.mobile}</p>
              </div>

              {data.trainer && (
                <div className="mb-4">
                  <p className="label-eyebrow">Trainer</p>
                  <p className="font-medium">{data.trainer.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.trainer.mobile}</p>
                </div>
              )}

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr style={{ color: 'var(--text-muted)' }}>
                    <th className="text-left font-normal pb-2">Description</th>
                    <th className="text-left font-normal pb-2">Valid Till</th>
                    <th className="text-right font-normal pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: '1px solid var(--surface-2)' }}>
                    <td className="py-2">
                      {data.plan.type === 'personal_training'
                        ? `Personal Training — ${data.trainer?.name ?? ''}`
                        : `${data.plan.name} Membership (${data.plan.durationMonths} mo)`}
                    </td>
                    <td className="py-2">{new Date(data.plan.endDate).toLocaleDateString()}</td>
                    <td className="py-2 text-right">₹{data.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end border-t pt-3" style={{ borderColor: 'var(--surface-2)' }}>
                <p className="font-semibold">Total Paid: ₹{data.amount.toFixed(2)}</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary inline-block text-center"
              style={{ width: 'auto' }}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}