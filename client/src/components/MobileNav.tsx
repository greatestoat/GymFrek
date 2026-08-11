import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useGym } from '../context/GymContext';
import NotificationBell from './NotificationBell';
import {
  Dumbbell, LayoutDashboard, Users, CreditCard,
  Settings, UserCircle, Wallet, Menu, X, LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/members', label: 'Members', icon: <Users size={20} /> },
  { to: '/plans', label: 'Plans', icon: <CreditCard size={20} /> },
  { to: '/dues', label: 'Dues', icon: <Wallet size={20} /> },
  { to: '/gym-settings', label: 'Gym Settings', icon: <Settings size={20} /> },
  { to: '/profile', label: 'My Profile', icon: <UserCircle size={20} /> },
];

export default function MobileNav({ onLogout }: { onLogout: () => void }) {
  const { gym } = useGym();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Full-width top bar — sibling of nothing but itself, always spans 100% */}
      <div
        className="lg:hidden sticky top-0 z-40 w-full flex items-center justify-between px-4 py-3 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Dumbbell size={22} style={{ color: 'var(--accent)' }} className="shrink-0" />
          <span className="font-semibold text-base tracking-[0.18em] uppercase truncate">
            gym<span style={{ color: 'var(--accent)' }}>_</span>frek
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <NotificationBell />
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-72 max-w-[85vw] p-5 flex flex-col shadow-2xl"
            style={{ backgroundColor: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="font-semibold text-base tracking-[0.18em] uppercase">
                gym<span style={{ color: 'var(--accent)' }}>_</span>frek
              </span>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-white/5"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {gym && (
              <div className="mb-5 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Managing
                </p>
                <p className="font-semibold text-sm truncate">{gym.name}</p>
              </div>
            )}

            <nav className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                      isActive ? 'shadow-lg shadow-black/10' : 'hover:bg-white/5 opacity-80'
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? 'var(--accent-contrast)' : 'var(--text-primary)',
                  })}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-1">
              <NavLink
                to="/support"
                onClick={() => setOpen(false)}
                className="text-sm font-medium px-3.5 py-2.5 rounded-xl hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
              >
                Support &amp; Help Center
              </NavLink>
              <button
                type="button"
                onClick={() => { setOpen(false); onLogout(); }}
                className="flex items-center gap-2 text-sm font-medium px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-left"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut size={18} /> Log out
              </button>
              <p className="text-[11px] font-mono tracking-widest uppercase opacity-60 mt-2 px-3.5">
                gym_frek © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}