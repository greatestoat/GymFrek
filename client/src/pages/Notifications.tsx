import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import type { AppNotification } from '../types';

function formatFull(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationRow({
  notification,
  onSelect,
}: {
  notification: AppNotification;
  onSelect: (n: AppNotification) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className="w-full text-left card flex gap-4 items-start transition hover:brightness-110"
      style={{
        borderLeft: notification.isRead ? undefined : '3px solid var(--accent)',
      }}
    >
      <div
        className="mt-1 w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
        style={{
          backgroundColor: notification.isRead ? 'var(--surface-2)' : 'var(--accent)',
          color: notification.isRead ? 'var(--text-muted)' : 'var(--accent-contrast)',
        }}
        aria-hidden
      >
        💬
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-sm truncate"
            style={{
              color: 'var(--text)',
              fontWeight: notification.isRead ? 500 : 700,
            }}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="badge shrink-0" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}>
              New
            </span>
          )}
        </div>
        {notification.body && (
          <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {notification.body}
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {formatFull(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

export default function Notifications() {
  const { notifications, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.id);
    if (n.ticketId) navigate('/support');
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-16">
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="font-display text-3xl mb-1" style={{ color: 'var(--text)' }}>
            Notifications
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'You\u2019re all caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={() => markAllRead()} className="btn-primary">
            Mark all read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No notifications yet. We'll let you know here when your support questions get answered.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}