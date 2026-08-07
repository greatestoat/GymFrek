import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import Modal from './Modal';
import { assignPlan } from '../api/plans';
import type { ApiErrorPayload, Member, MembershipPlan } from '../types';

interface Props {
  open: boolean;
  member: Member | null;
  plans: MembershipPlan[];
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignPersonalTrainingModal({ open, member, plans, onClose, onAssigned }: Props) {
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [trainerMobile, setTrainerMobile] = useState('');
  const [trainerFee, setTrainerFee] = useState<string>('');
  const [trainerNotes, setTrainerNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ptPlans = plans.filter((p) => p.isActive && p.planType === 'personal_training');
  const selectedPlan = ptPlans.find((p) => p.id === planId);

  useEffect(() => {
    if (!open) return;
    setPlanId(ptPlans[0]?.id || '');
    setStartDate(new Date().toISOString().slice(0, 10));
    setTrainerName('');
    setTrainerMobile('');
    setTrainerFee('');
    setTrainerNotes('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  if (!member) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!planId) {
      setError('Select a personal training package.');
      return;
    }
    if (!trainerName.trim() || !trainerMobile.trim() || !trainerFee) {
      setError('Trainer name, mobile, and fee are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await assignPlan({
        memberId: member.id,
        planId,
        startDate: startDate || undefined,
        pricePaid: Number(trainerFee),
        trainerName: trainerName.trim(),
        trainerMobile: trainerMobile.trim(),
        trainerFee: Number(trainerFee),
        trainerNotes: trainerNotes.trim() || undefined,
      });
      onAssigned();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      setError(axiosErr.response?.data?.message || 'Could not assign personal training.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={`Assign Personal Training — ${member.fullName}`} onClose={onClose} maxWidthClass="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'rgba(255,77,77,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {ptPlans.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            You don't have any personal training packages yet. Create one from the Plans page → Personal Training tab first.
          </p>
        ) : (
          <>
            <div>
              <label className="label-eyebrow" htmlFor="ptPlan">Package *</label>
              <select id="ptPlan" className="input-field" value={planId} onChange={(e) => setPlanId(e.target.value)} required>
                {ptPlans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.durationMonths}mo</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-eyebrow" htmlFor="trainerName">Trainer Name *</label>
                <input id="trainerName" className="input-field" value={trainerName} onChange={(e) => setTrainerName(e.target.value)} required />
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="trainerMobile">Trainer Mobile *</label>
                <input id="trainerMobile" className="input-field" value={trainerMobile} onChange={(e) => setTrainerMobile(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-eyebrow" htmlFor="startDate">Start Date</label>
                <input id="startDate" type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="trainerFee">Fee (₹) *</label>
                <input
                  id="trainerFee"
                  type="number"
                  min={0}
                  step={0.01}
                  className="input-field"
                  placeholder={selectedPlan ? String(selectedPlan.finalPrice) : ''}
                  value={trainerFee}
                  onChange={(e) => setTrainerFee(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-eyebrow" htmlFor="trainerNotes">Notes</label>
              <textarea id="trainerNotes" className="input-field" rows={2} value={trainerNotes} onChange={(e) => setTrainerNotes(e.target.value)} placeholder="Schedule, goals, anything the trainer/admin should know" />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={saving || ptPlans.length === 0}>
            {saving ? 'Assigning…' : 'Assign personal training'}
          </button>
        </div>
      </form>
    </Modal>
  );
}