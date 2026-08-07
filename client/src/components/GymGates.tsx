import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useGym } from '../context/GymContext';
import { useAuth } from '../context/AuthContext';
import PulseLoader from './PulseLoader';

// Wrap routes that require a registered gym (dashboard, members, plans...).
// Redirects to the registration wizard if the owner hasn't registered yet.
// Admins never have a gym, so they're sent to the admin panel instead.
export function RequireGym({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { gym, loading } = useGym();
  if (loading) return <PulseLoader />;
  if (user?.role === 'admin') return <Navigate to="/admin/overview" replace />;
  if (!gym) return <Navigate to="/register-gym" replace />;
  return <>{children}</>;
}

// Wraps the registration wizard itself. Once a gym exists, never show the
// wizard again - send the owner straight to their dashboard. Admins can't
// register a gym at all.
export function RequireNoGym({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { gym, loading } = useGym();
  if (loading) return <PulseLoader />;
  if (user?.role === 'admin') return <Navigate to="/admin/overview" replace />;
  if (gym) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
