import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import Modal from './Modal';
import { assignPlan } from '../api/plans';
import type { ApiErrorPayload, Member, MembershipPlan } from '../types';

interface AssignPlanModalProps {
  open: boolean;
  member: Member | null;
  plans: MembershipPlan[];
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignPlanModal({ open, member, plans, onClose, onAssigned }: AssignPlanModalProps) {
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [pricePaid, setPricePaid] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePlans = plans.filter((p) => p.isActive);
  const selectedPlan = activePlans.find((p) => p.id === planId);

  useEffect(() => {
    if (!open) return;
    setPlanId(activePlans[0]?.id || '');
    setStartDate(new Date().toISOString().slice(0, 10));
    setPricePaid('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  if (!member) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!planId) {
      setError('Select a plan to assign.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await assignPlan({
        memberId: member.id,
        planId,
        startDate: startDate || undefined,
        pricePaid: pricePaid ? Number(pricePaid) : undefined,
      });
      onAssigned();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      setError(axiosErr.response?.data?.message || 'Could not assign this plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={`Assign Plan — ${member.fullName}`} onClose={onClose} maxWidthClass="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'rgba(255,77,77,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {activePlans.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            You don't have any active plans yet. Create one from the Plans page first.
          </p>
        ) : (
          <>
            <div>
              <label className="label-eyebrow" htmlFor="plan">Plan *</label>
              <select id="plan" className="input-field" value={planId} onChange={(e) => setPlanId(e.target.value)} required>
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ₹{p.finalPrice} / {p.durationMonths}mo</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-eyebrow" htmlFor="startDate">Start Date</label>
                <input id="startDate" type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="pricePaid">Price Paid</label>
                <input
                  id="pricePaid"
                  type="number"
                  min={0}
                  step={0.01}
                  className="input-field"
                  placeholder={selectedPlan ? String(selectedPlan.finalPrice) : ''}
                  value={pricePaid}
                  onChange={(e) => setPricePaid(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={saving || activePlans.length === 0}>
            {saving ? 'Assigning…' : 'Assign plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
