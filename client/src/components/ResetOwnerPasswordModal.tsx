import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import Modal from './Modal';
import { setOwnerPassword } from '../api/admin';
import type { ApiErrorPayload } from '../types';

interface ResetOwnerPasswordModalProps {
  open: boolean;
  ownerId: string | null;
  ownerName: string;
  onClose: () => void;
  onDone: () => void;
}

export default function ResetOwnerPasswordModal({ open, ownerId, ownerName, onClose, onDone }: ResetOwnerPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirm('');
    setError(null);
  }, [open]);

  if (!ownerId) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await setOwnerPassword(ownerId, password);
      onDone();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      setError(axiosErr.response?.data?.message || 'Could not update the password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={`Reset Password — ${ownerName}`} onClose={onClose} maxWidthClass="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', backgroundColor: 'rgba(255,77,77,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This sets a new password directly and logs the owner out of all their active sessions.
        </p>
        <div>
          <label className="label-eyebrow" htmlFor="newPassword">New Password</label>
          <input id="newPassword" type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </div>
        <div>
          <label className="label-eyebrow" htmlFor="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" type="password" className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
