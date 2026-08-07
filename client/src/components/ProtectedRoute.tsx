import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import PulseLoader from './PulseLoader';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PulseLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
