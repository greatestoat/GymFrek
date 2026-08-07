import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useGym } from '../../context/GymContext';
import { uploadGymLogo } from '../../api/gym';
import { useToast } from '../../context/ToastContext';
import type { ApiErrorPayload, GymFormInput } from '../../types';

const normalizeTimeValue = (value: string | null | undefined) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.length > 5 ? trimmed.slice(0, 5) : trimmed;
};

export default function GymSettings() {
  const { gym, updateGym, setGym } = useGym();
  const { showToast } = useToast();
  const [form, setForm] = useState<GymFormInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gym) return;
    setForm({
      name: gym.name ?? '',
      ownerName: gym.ownerName ?? '',
      mobile: gym.mobile ?? '',
      email: gym.email ?? '',
      address: gym.address ?? '',
      city: gym.city ?? '',
      state: gym.state ?? '',
      pincode: gym.pincode ?? '',
      openingTime: normalizeTimeValue(gym.openingTime),
      closingTime: normalizeTimeValue(gym.closingTime),
      description: gym.description ?? '',
    });
  }, [gym]);

  if (!gym || !form) return null;

  const update = (field: keyof GymFormInput) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => (prev ? { ...prev, [field]: e.target.value } : prev));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await updateGym({
        ...form,
        openingTime: normalizeTimeValue(form.openingTime),
        closingTime: normalizeTimeValue(form.closingTime),
      });
      showToast('Gym details updated.', 'success');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      const errorPayload = axiosErr.response?.data;

      setError(
        errorPayload?.errors
          ?.map((e) => `${e.field}: ${e.message}`)
          .join('\n') ||
        errorPayload?.message ||
        'Could not save changes.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const updated = await uploadGymLogo(file);
      setGym(updated);
      showToast('Logo updated.', 'success');
    } catch {
      showToast('Could not upload logo. Try a smaller JPEG, PNG, or WEBP file.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl mb-1">Gym Settings</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Update your gym's public details. Changes apply immediately.
      </p>

      <div className="card mb-6 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-display shrink-0 overflow-hidden"
          style={{ backgroundColor: 'var(--surface-2)' }}
        >
          {gym.logoUrl ? (
            <img src={gym.logoUrl} alt={`${gym.name} logo`} className="w-full h-full object-cover" />
          ) : (
            gym.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <label htmlFor="logo-upload" className="btn-secondary cursor-pointer inline-flex" style={{ width: 'auto' }}>
            {uploadingLogo ? 'Uploading…' : 'Change logo'}
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleLogoChange}
            disabled={uploadingLogo}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPEG, PNG, or WEBP, up to 3MB.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'rgba(255,77,77,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow" htmlFor="name">Gym Name</label>
            <input id="name" className="input-field" value={form.name} onChange={update('name')} required />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="ownerName">Owner Name</label>
            <input id="ownerName" className="input-field" value={form.ownerName} onChange={update('ownerName')} required />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="mobile">Mobile Number</label>
            <input id="mobile" className="input-field" value={form.mobile} onChange={update('mobile')} required />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="email">Email</label>
            <input id="email" type="email" className="input-field" value={form.email} onChange={update('email')} required />
          </div>
        </div>
        <div>
          <label className="label-eyebrow" htmlFor="address">Address</label>
          <textarea id="address" className="input-field" rows={2} value={form.address} onChange={update('address')} required />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label-eyebrow" htmlFor="city">City</label>
            <input id="city" className="input-field" value={form.city} onChange={update('city')} required />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="state">State</label>
            <input id="state" className="input-field" value={form.state} onChange={update('state')} required />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="pincode">Pincode</label>
            <input id="pincode" className="input-field" value={form.pincode} onChange={update('pincode')} required />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow" htmlFor="openingTime">Opening Time</label>
            <input id="openingTime" type="time" className="input-field" value={form.openingTime} onChange={update('openingTime')} required />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="closingTime">Closing Time</label>
            <input id="closingTime" type="time" className="input-field" value={form.closingTime} onChange={update('closingTime')} required />
          </div>
        </div>
        <div>
          <label className="label-eyebrow" htmlFor="description">Description</label>
          <textarea id="description" className="input-field" rows={4} value={form.description ?? ''} onChange={update('description')} />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
