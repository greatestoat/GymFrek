import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications';
import type { AppNotification } from '../types';

const POLL_INTERVAL_MS = 30_000;

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch {
      // Silent - the bell just won't update this cycle, next poll retries.
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Lightweight poll for just the count, so the badge stays live without
  // pulling the full list every 30s. Full list is fetched lazily (on open).
  const pollCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Ignore - transient network hiccups shouldn't spam the console.
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    pollCount();
    pollRef.current = setInterval(pollCount, POLL_INTERVAL_MS);

    // Pause polling while the tab is hidden, catch up the moment it's
    // visible again instead of waiting for the next tick.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') pollCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, pollCount]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(id);
    } catch {
      // Best-effort - a stale unread badge is a minor inconvenience, not
      // worth reverting optimistic state over.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}