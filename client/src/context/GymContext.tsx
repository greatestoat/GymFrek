import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchMyGym, registerGym as apiRegisterGym, updateGym as apiUpdateGym } from '../api/gym';
import type { Gym, GymFormInput } from '../types';

interface GymContextValue {
  gym: Gym | null;
  loading: boolean;
  registerGym: (input: GymFormInput) => Promise<Gym>;
  updateGym: (input: Partial<GymFormInput>) => Promise<Gym>;
  refreshGym: () => Promise<void>;
  setGym: (gym: Gym) => void;
}

const GymContext = createContext<GymContextValue | undefined>(undefined);

export function GymProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshGym = useCallback(async () => {
    if (!user) {
      setGym(null);
      setLoading(false);
      return;
    }
    if (user.role === 'admin') {
      setGym(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchMyGym();
      setGym(result);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshGym();
  }, [refreshGym]);

  const registerGym = useCallback(async (input: GymFormInput) => {
    const created = await apiRegisterGym(input);
    setGym(created);
    return created;
  }, []);

  const updateGym = useCallback(async (input: Partial<GymFormInput>) => {
    const updated = await apiUpdateGym(input);
    setGym(updated);
    return updated;
  }, []);

  return (
    <GymContext.Provider value={{ gym, loading, registerGym, updateGym, refreshGym, setGym }}>
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error('useGym must be used within a GymProvider');
  return ctx;
}
