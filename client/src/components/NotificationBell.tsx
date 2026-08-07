import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import type { AppNotification } from '../types';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const { notifications, unreadCount, refresh, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) refresh();
  };

  const handleSelect = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.id);
    setOpen(false);
    navigate('/notifications');
  };

  const preview = notifications.slice(0, 5);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="btn-icon relative"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 8c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-h-[26rem] overflow-y-auto rounded-xl border shadow-2xl z-30"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          role="menu"
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Notifications
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {preview.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              You're all caught up.
            </p>
          ) : (
            <ul>
              {preview.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(n)}
                    className="w-full text-left px-4 py-3 flex gap-3 items-start transition-colors border-b last:border-0 hover:brightness-95"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: n.isRead ? 'transparent' : 'var(--accent)' }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 min-w-0">
                      <span
                        className="block text-sm truncate"
                        style={{
                          color: 'var(--text)',
                          fontWeight: n.isRead ? 500 : 700,
                        }}
                      >
                        {n.title}
                      </span>
                      {n.body && (
                        <span
                          className="block text-xs truncate mt-0.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {n.body}
                        </span>
                      )}
                      <span className="block text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
            className="w-full text-center py-2.5 text-xs font-semibold hover:underline border-t"
            style={{ color: 'var(--accent)', borderColor: 'var(--border)' }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}