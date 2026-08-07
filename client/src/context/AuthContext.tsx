import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import api, { setAccessToken, SESSION_REPLACED_EVENT } from '../api/axios';
import type { User, AuthResponse } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  // Set when the session ended because the account was signed in elsewhere,
  // so Login (or a toast) can explain why the user landed back here.
  sessionEndedReason: string | null;
  clearSessionEndedReason: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Module-scoped (outside the component) so it survives React 18 StrictMode's
// dev-only mount -> unmount -> remount cycle, which otherwise fires this
// effect twice in a row. Since refresh tokens rotate on every use (the old
// one is revoked as soon as a new one is issued), two near-simultaneous
// calls sharing the same starting cookie would race: the second call's
// token no longer matches an active row and gets rejected, wrongly logging
// the user out. Caching the in-flight/resolved promise here guarantees only
// one real network request ever happens per page load, no matter how many
// times the effect below runs.
let sessionBootstrap: Promise<AuthResponse | null> | null = null;

function bootstrapSession(): Promise<AuthResponse | null> {
  if (!sessionBootstrap) {
    sessionBootstrap = api
      .post<AuthResponse>('/auth/refresh')
      .then((res) => res.data)
      .catch(() => null);
  }
  return sessionBootstrap;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionEndedReason, setSessionEndedReason] = useState<string | null>(null);

  // SESSION REPLACEMENT: the axios interceptor fires this the moment a
  // request comes back marked SESSION_REPLACED. We log out immediately
  // rather than waiting for the user to notice something's wrong.
  useEffect(() => {
    function handleSessionReplaced(e: Event) {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      setAccessToken(null);
      setUser(null);
      setSessionEndedReason(
        detail?.message || 'You were signed out because your account was signed in elsewhere.'
      );
    }
    window.addEventListener(SESSION_REPLACED_EVENT, handleSessionReplaced);
    return () => window.removeEventListener(SESSION_REPLACED_EVENT, handleSessionReplaced);
  }, []);

  const clearSessionEndedReason = useCallback(() => setSessionEndedReason(null), []);

  // On first load there's no access token in memory (page refresh wipes it),
  // so we silently try the refresh-cookie flow to restore the session.
  useEffect(() => {
    let cancelled = false;

    bootstrapSession().then((data) => {
      if (cancelled) return;
      if (data) {
        setAccessToken(data.accessToken);
        setUser(data.user);
      } else {
        setAccessToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    setSessionEndedReason(null);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<{ user: User }>('/users/me');
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionEndedReason,
        clearSessionEndedReason,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}