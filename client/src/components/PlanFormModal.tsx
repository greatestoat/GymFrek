import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import Modal from './Modal';
import { createPlan, updatePlan } from '../api/plans';
import type { ApiErrorPayload, MembershipPlan, PlanFormInput, PlanType } from '../types';

interface PlanFormModalProps {
  open: boolean;
  plan: MembershipPlan | null;
  defaultPlanType?: PlanType;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = (planType: PlanType): PlanFormInput => ({
  name: '',
  description: '',
  planType,
  durationMonths: 1,
  price: 0,
  discount: 0,
  features: [],
  isActive: true,
});

export default function PlanFormModal({ open, plan, defaultPlanType = 'membership', onClose, onSaved }: PlanFormModalProps) {
  const [form, setForm] = useState<PlanFormInput>(emptyForm(defaultPlanType));
  const [featuresText, setFeaturesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPT = form.planType === 'personal_training';

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (plan) {
      setForm({
        name: plan.name,
        description: plan.description || '',
        planType: plan.planType,
        durationMonths: plan.durationMonths,
        price: plan.price,
        discount: plan.discount,
        features: plan.features,
        isActive: plan.isActive,
      });
      setFeaturesText(plan.features.join('\n'));
    } else {
      setForm(emptyForm(defaultPlanType));
      setFeaturesText('');
    }
  }, [open, plan, defaultPlanType]);

  const set = <K extends keyof PlanFormInput>(field: K, value: PlanFormInput[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const finalPrice = Math.max(0, (form.price || 0) - (form.discount || 0));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: PlanFormInput = {
        ...form,
        features: featuresText.split('\n').map((f) => f.trim()).filter(Boolean),
      };
      if (plan) {
        await updatePlan(plan.id, payload);
      } else {
        await createPlan(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      setError(axiosErr.response?.data?.message || 'Could not save this plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={plan ? 'Edit Plan' : isPT ? 'Create Personal Training Plan' : 'Create Plan'} onClose={onClose} maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'rgba(255,77,77,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {!plan && (
          <div>
            <label className="label-eyebrow">Plan Type *</label>
            <div className="flex gap-2">
              <button type="button" className={form.planType === 'membership' ? 'btn-primary' : 'btn-secondary'} style={{ width: 'auto' }} onClick={() => set('planType', 'membership')}>Membership</button>
              <button type="button" className={form.planType === 'personal_training' ? 'btn-primary' : 'btn-secondary'} style={{ width: 'auto' }} onClick={() => set('planType', 'personal_training')}>Personal Training</button>
            </div>
          </div>
        )}

        <div>
          <label className="label-eyebrow" htmlFor="planName">{isPT ? 'Package Name' : 'Plan Name'} *</label>
          <input id="planName" className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={isPT ? 'e.g. 1-on-1 Strength Coaching' : 'e.g. Strength Training'} required />
        </div>
        <div>
          <label className="label-eyebrow" htmlFor="planDesc">Description</label>
          <textarea id="planDesc" className="input-field" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label-eyebrow" htmlFor="duration">Duration *</label>
            <select id="duration" className="input-field" value={form.durationMonths} onChange={(e) => set('durationMonths', Number(e.target.value) as PlanFormInput['durationMonths'])}>
              <option value={1}>1 Month</option>
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="price">{isPT ? 'Default Fee (₹)' : 'Price (₹)'} *</label>
            <input id="price" type="number" min={0} step={0.01} className="input-field" value={form.price} onChange={(e) => set('price', Number(e.target.value))} required />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="discount">Discount (₹)</label>
            <input id="discount" type="number" min={0} step={0.01} className="input-field" value={form.discount} onChange={(e) => set('discount', Number(e.target.value))} />
          </div>
        </div>

        {isPT && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            The actual trainer name, mobile, and fee are captured per member when you assign this package — this fee is just the default shown on assignment.
          </p>
        )}

        <div className="rounded-lg px-3.5 py-2.5 text-sm flex items-center justify-between" style={{ backgroundColor: 'var(--surface-2)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Final Price</span>
          <span className="font-display text-lg">₹{finalPrice.toFixed(2)}</span>
        </div>

        <div>
          <label className="label-eyebrow" htmlFor="features">Features Included (one per line)</label>
          <textarea id="features" className="input-field" rows={4} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder={isPT ? 'Personalized workout plan\nWeekly progress check-ins\nDiet guidance' : 'Unlimited gym access\n1 free trainer session\nLocker access'} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Plan is active and assignable
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving…' : plan ? 'Save changes' : 'Create plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}