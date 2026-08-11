import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useGym } from '../context/GymContext';
import {
  Dumbbell, LayoutDashboard, Users, CreditCard,
  Settings, UserCircle, Wallet,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/members', label: 'Members', icon: <Users size={20} /> },
  { to: '/plans', label: 'Plans', icon: <CreditCard size={20} /> },
  { to: '/dues', label: 'Dues', icon: <Wallet size={20} /> },
  { to: '/gym-settings', label: 'Gym Settings', icon: <Settings size={20} /> },
  { to: '/profile', label: 'My Profile', icon: <UserCircle size={20} /> },
];

function NavItems({ expanded }: { expanded: boolean }) {
  return (
    <nav className="flex flex-col gap-1.5 px-3">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `group relative flex items-center rounded-xl py-3 transition-all duration-300 ease-in-out ${
              expanded ? 'px-3.5 justify-start' : 'px-0 justify-center'
            } ${isActive ? 'font-semibold shadow-lg shadow-black/10' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? 'var(--accent)' : 'transparent',
            color: isActive ? 'var(--accent-contrast)' : 'var(--text-muted)',
          })}
          title={!expanded ? item.label : undefined}
        >
          <span className="shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            {item.icon}
          </span>
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
              expanded ? 'max-w-[180px] opacity-100 ml-3 translate-x-0' : 'max-w-0 opacity-0 ml-0 -translate-x-2'
            }`}
          >
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const { gym } = useGym();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`hidden lg:flex flex-col border-r sticky top-0 h-screen shrink-0 transition-all duration-300 ease-in-out z-30 ${
        expanded ? 'w-64 shadow-2xl' : 'w-20'
      }`}
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center h-20 px-5 relative overflow-hidden">
        <div className="flex items-center justify-center shrink-0">
          <Dumbbell size={26} strokeWidth={2.2} style={{ color: 'var(--accent)' }} />
        </div>
        <span
          className={`font-semibold text-base tracking-[0.18em] uppercase whitespace-nowrap transition-all duration-300 ease-out ${
            expanded ? 'opacity-100 max-w-[180px] ml-3.5 translate-x-0' : 'opacity-0 max-w-0 ml-0 -translate-x-3'
          }`}
        >
          GYM<span className="animate-pulse mx-[1px]" style={{ color: 'var(--accent)' }}>_</span>FREK
        </span>
      </div>

      {gym && (
        <div
          className={`transition-all duration-300 overflow-hidden px-3 ${
            expanded ? 'opacity-100 max-h-20 mb-4 translate-y-0' : 'opacity-0 max-h-0 mb-0 -translate-y-2'
          }`}
        >
          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
              <p className="text-[10px] font-medium uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                Managing
              </p>
            </div>
            <p className="font-semibold text-sm tracking-wide capitalize truncate" style={{ color: 'var(--text-primary)' }}>
              {gym.name}
            </p>
          </div>
        </div>
      )}

      <NavItems expanded={expanded} />

      <div
        className={`mt-auto transition-all duration-300 overflow-hidden px-5 ${
          expanded ? 'opacity-100 max-h-24 py-4' : 'opacity-0 max-h-0 py-0'
        }`}
        style={{ color: 'var(--text-muted)' }}
      >
        <NavLink to="/support" className="block text-xs font-medium mb-2 hover:underline" style={{ color: 'var(--text-muted)' }}>
          Support &amp; Help Center
        </NavLink>
        <p className="text-[11px] font-mono tracking-widest uppercase opacity-60">
          gym_frek © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}