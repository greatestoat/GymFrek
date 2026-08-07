import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useGym } from '../../context/GymContext';
import { uploadGymLogo } from '../../api/gym';
import { useToast } from '../../context/ToastContext';
import type { ApiErrorPayload, GymFormInput } from '../../types';

const STEPS = ['Gym Identity', 'Contact & Location', 'Hours & Story', 'Logo & Review'];

const EMPTY_FORM: GymFormInput = {
  name: '',
  ownerName: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  openingTime: '06:00',
  closingTime: '22:00',
  description: '',
};

export default function RegisterGym() {
  const { registerGym } = useGym();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<GymFormInput>(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof GymFormInput) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validateStep = (): boolean => {
    if (step === 0) return !!(form.name.trim() && form.ownerName.trim());
    if (step === 1) return !!(form.mobile.trim() && form.email.trim() && form.address.trim() && form.city.trim() && form.state.trim() && form.pincode.trim());
    if (step === 2) return !!(form.openingTime && form.closingTime);
    return true;
  };

  const next = () => {
    setError(null);
    if (!validateStep()) {
      setError('Please fill in all required fields before continuing.');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setError(null);
    setSubmitting(true);
    try {
      await registerGym(form);
      if (logoFile) {
        try {
          await uploadGymLogo(logoFile);
        } catch {
          showToast('Gym registered, but the logo upload failed. You can retry it from Gym Settings.', 'error');
        }
      }
      showToast('Gym registered! Welcome to your dashboard.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      setError(axiosErr.response?.data?.message || 'Could not register your gym. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--accent)' }}>
            One-time setup
          </p>
          <h1 className="font-display text-3xl sm:text-4xl mb-2">Register your gym</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tell us about your gym. You can edit these details anytime from Gym Settings.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ backgroundColor: i <= step ? 'var(--accent)' : 'var(--surface-2)' }}
              />
              <p
                className="text-[11px] mt-2 hidden sm:block"
                style={{ color: i <= step ? 'var(--text)' : 'var(--text-muted)' }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="card" noValidate>
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--danger)', backgroundColor: 'rgba(255,77,77,0.1)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label-eyebrow" htmlFor="name">Gym Name *</label>
                <input id="name" className="input-field" value={form.name} onChange={update('name')} placeholder="e.g. Rahul Gym" required />
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="ownerName">Owner Name *</label>
                <input id="ownerName" className="input-field" value={form.ownerName} onChange={update('ownerName')} placeholder="e.g. Rahul Sharma" required />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-eyebrow" htmlFor="mobile">Mobile Number *</label>
                  <input id="mobile" className="input-field" value={form.mobile} onChange={update('mobile')} placeholder="9876543210" required />
                </div>
                <div>
                  <label className="label-eyebrow" htmlFor="email">Email *</label>
                  <input id="email" type="email" className="input-field" value={form.email} onChange={update('email')} placeholder="gym@example.com" required />
                </div>
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="address">Address *</label>
                <textarea id="address" className="input-field" rows={2} value={form.address} onChange={update('address')} required />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-eyebrow" htmlFor="city">City *</label>
                  <input id="city" className="input-field" value={form.city} onChange={update('city')} required />
                </div>
                <div>
                  <label className="label-eyebrow" htmlFor="state">State *</label>
                  <input id="state" className="input-field" value={form.state} onChange={update('state')} required />
                </div>
                <div>
                  <label className="label-eyebrow" htmlFor="pincode">Pincode *</label>
                  <input id="pincode" className="input-field" value={form.pincode} onChange={update('pincode')} required />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-eyebrow" htmlFor="openingTime">Opening Time *</label>
                  <input id="openingTime" type="time" className="input-field" value={form.openingTime} onChange={update('openingTime')} required />
                </div>
                <div>
                  <label className="label-eyebrow" htmlFor="closingTime">Closing Time *</label>
                  <input id="closingTime" type="time" className="input-field" value={form.closingTime} onChange={update('closingTime')} required />
                </div>
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="description">Description (optional)</label>
                <textarea
                  id="description"
                  className="input-field"
                  rows={4}
                  value={form.description ?? ''}
                  onChange={update('description')}
                  placeholder="What makes your gym stand out?"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="label-eyebrow" htmlFor="logo">Gym Logo (optional)</label>
                <input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="input-field"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="rounded-lg p-4 text-sm space-y-1" style={{ backgroundColor: 'var(--surface-2)' }}>
                <p><strong>{form.name}</strong> — owned by {form.ownerName}</p>
                <p style={{ color: 'var(--text-muted)' }}>{form.address}, {form.city}, {form.state} {form.pincode}</p>
                <p style={{ color: 'var(--text-muted)' }}>{form.mobile} · {form.email}</p>
                <p style={{ color: 'var(--text-muted)' }}>Open {form.openingTime} – {form.closingTime}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-7">
            <button type="button" className="btn-secondary" onClick={back} disabled={step === 0 || submitting}>
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={next}>
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={submitting}>
                {submitting ? 'Registering…' : 'Register gym'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
