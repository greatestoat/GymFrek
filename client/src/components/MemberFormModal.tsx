import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import Modal from './Modal';
import { createMember, updateMember } from '../api/members';
import type { ApiErrorPayload, Member, MemberFormInput } from '../types';

interface MemberFormModalProps {
  open: boolean;
  member: Member | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: MemberFormInput = {
  fullName: '',
  mobile: '',
  email: '',
  gender: undefined,
  dateOfBirth: '',
  address: '',
  emergencyContact: '',
  joinDate: '',
  membershipStatus: 'Active',
};

export default function MemberFormModal({ open, member, onClose, onSaved }: MemberFormModalProps) {
  const [form, setForm] = useState<MemberFormInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFieldErrors({});
    if (member) {
      setForm({
        fullName: member.fullName,
        mobile: member.mobile,
        email: member.email || '',
        gender: member.gender || undefined,
        dateOfBirth: member.dateOfBirth || '',
        address: member.address || '',
        emergencyContact: member.emergencyContact || '',
        heightCm: member.heightCm || undefined,
        weightKg: member.weightKg || undefined,
        medicalNotes: member.medicalNotes || '',
        joinDate: member.joinDate,
        membershipStatus: member.membershipStatus,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, member]);

  const set = <K extends keyof MemberFormInput>(field: K, value: MemberFormInput[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const payload: MemberFormInput = {
        ...form,
        email: form.email || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address || undefined,
        emergencyContact: form.emergencyContact || undefined,
        medicalNotes: form.medicalNotes || undefined,
        joinDate: form.joinDate || undefined,
      };
      if (member) {
        await updateMember(member.id, payload);
      } else {
        await createMember(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      const data = axiosErr.response?.data;
      if (data?.errors) {
        setFieldErrors(Object.fromEntries(data.errors.map((e2) => [e2.field, e2.message])));
      }
      setError(data?.message || 'Could not save this member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={member ? 'Edit Member' : 'Add Member'} onClose={onClose} maxWidthClass="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'rgba(255,77,77,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow" htmlFor="fullName">Full Name *</label>
            <input id="fullName" className="input-field" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
            {fieldErrors.fullName && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{fieldErrors.fullName}</p>}
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="mobile">Mobile Number *</label>
            <input id="mobile" className="input-field" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
            {fieldErrors.mobile && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{fieldErrors.mobile}</p>}
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="email">Email</label>
            <input id="email" type="email" className="input-field" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="gender">Gender</label>
            <select id="gender" className="input-field" value={form.gender || ''} onChange={(e) => set('gender', (e.target.value || undefined) as MemberFormInput['gender'])}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="dob">Date of Birth</label>
            <input id="dob" type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="emergencyContact">Emergency Contact</label>
            <input id="emergencyContact" className="input-field" value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="height">Height (cm)</label>
            <input id="height" type="number" min={0} step={0.1} className="input-field" value={form.heightCm ?? ''} onChange={(e) => set('heightCm', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="weight">Weight (kg)</label>
            <input id="weight" type="number" min={0} step={0.1} className="input-field" value={form.weightKg ?? ''} onChange={(e) => set('weightKg', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="joinDate">Join Date</label>
            <input id="joinDate" type="date" className="input-field" value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="status">Membership Status</label>
            <select id="status" className="input-field" value={form.membershipStatus} onChange={(e) => set('membershipStatus', e.target.value as MemberFormInput['membershipStatus'])}>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-eyebrow" htmlFor="address">Address</label>
          <textarea id="address" className="input-field" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div>
          <label className="label-eyebrow" htmlFor="medicalNotes">Medical Notes</label>
          <textarea id="medicalNotes" className="input-field" rows={2} value={form.medicalNotes} onChange={(e) => set('medicalNotes', e.target.value)} placeholder="Injuries, conditions, allergies…" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving…' : member ? 'Save changes' : 'Add member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
