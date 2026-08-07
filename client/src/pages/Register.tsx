import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import PulseDivider from '../components/PulseDivider';
import type { ApiErrorPayload } from '../types';

function checkRules(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rules = useMemo(() => checkRules(password), [password]);
  const allValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allValid) {
      setError('Please meet all password requirements below.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      const msg =
        axiosErr.response?.data?.errors?.[0]?.message ||
        axiosErr.response?.data?.message ||
        'Unable to create your account. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const RuleItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className={`flex items-center gap-2 text-xs ${ok ? 'text-volt' : 'text-mist'}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-volt' : 'bg-mist/40'}`}
        aria-hidden="true"
      />
      {label}
    </li>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink">
      <div className="hidden lg:flex flex-col justify-between p-14 border-r border-white/5 relative overflow-hidden">
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-pulse/5 blur-3xl" />
        <div>
          <Link to="/" className="font-display text-xl text-chalk">
            gym<span className="text-volt">_</span>frek
          </Link>
        </div>
        <div className="relative">
          <p className="font-mono text-xs tracking-[0.3em] text-volt uppercase mb-4">
            Session 00 / Sign up
          </p>
          <h1 className="font-display text-6xl leading-[0.95] text-chalk mb-6">
            DAY ONE
            <br />
            STARTS
            <br />
            NOW.
          </h1>
          <PulseDivider className="max-w-xs" />
          <p className="text-mist mt-6 max-w-sm">
            Set your goal, log your first rep, and start building a record only you
            control.
          </p>
        </div>
        <p className="text-xs text-mist font-mono">gym_frek © {new Date().getFullYear()}</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="font-display text-xl text-chalk">
              gym<span className="text-volt">_</span>frek
            </Link>
          </div>

          <h2 className="font-display text-3xl text-chalk mb-1">Create your account</h2>
          <p className="text-mist text-sm mb-8">It takes less than a minute.</p>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-pulse/30 bg-pulse/10 px-4 py-3 text-sm text-pulse"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-mist uppercase tracking-wide mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Alex Rivera"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-mist uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-mist uppercase tracking-wide mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
              <ul className="grid grid-cols-2 gap-y-1.5 gap-x-3 mt-3">
                <RuleItem ok={rules.length} label="8+ characters" />
                <RuleItem ok={rules.upper} label="Uppercase letter" />
                <RuleItem ok={rules.lower} label="Lowercase letter" />
                <RuleItem ok={rules.number} label="A number" />
              </ul>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary mt-2">
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-mist mt-8 text-center">
            Already training with us?{' '}
            <Link to="/login" className="text-volt font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
