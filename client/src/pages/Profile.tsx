import { FormEvent, useState } from 'react';
import { AxiosError } from 'axios';
// import Navbar from '../components/Navbar';
import PulseDivider from '../components/PulseDivider';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { ApiErrorPayload, Goal, User } from '../types';

const GOALS: { value: Goal; label: string }[] = [
  { value: 'general_fitness', label: 'General fitness' },
  { value: 'strength', label: 'Strength' },
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'mobility', label: 'Mobility' },
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [goal, setGoal] = useState<Goal>(user?.goal || 'general_fitness');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    try {
      await api.patch<{ user: User }>('/users/me', { name, goal });
      await refreshUser();
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      setError(axiosErr.response?.data?.message || 'Could not save changes.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* <Navbar /> */}

      <main className="max-w-3xl mx-auto px-6 py-14">
        <p className="font-mono text-xs tracking-[0.3em] text-volt uppercase mb-3">
          Profile
        </p>
        <h1 className="font-display text-4xl text-chalk mb-4">Your details</h1>
        <PulseDivider className="max-w-xs mb-10" />

        <div className="rounded-xl border border-white/5 bg-surface p-8">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-ink font-display text-2xl"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-chalk font-semibold">{user.name}</p>
              <p className="text-mist text-sm">{user.email}</p>
              <p className="text-mist text-xs font-mono mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-pulse/30 bg-pulse/10 px-4 py-3 text-sm text-pulse"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-mist uppercase tracking-wide mb-2">
                Display name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="goal" className="block text-xs font-semibold text-mist uppercase tracking-wide mb-2">
                Training goal
              </label>
              <select
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="input-field appearance-none"
              >
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mist uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input-field opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-mist mt-2">Email changes aren't supported yet.</p>
            </div>

            <button
              type="submit"
              disabled={status === 'saving'}
              className="btn-primary sm:w-auto sm:px-8"
            >
              {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
