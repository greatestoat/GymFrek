import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import PulseLoader from './PulseLoader';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PulseLoader />;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
