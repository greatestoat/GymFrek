import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/admin/overview', label: 'Overview', icon: '◧' },
  { to: '/admin/gyms', label: 'Registered Gyms', icon: '⌂' },
  { to: '/admin/personal-training', label: 'Personal Training', icon: '🏋' },
  { to: '/admin/tickets', label: 'Tickets', icon: '🎫' },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
          style={({ isActive }) => ({
            backgroundColor: isActive ? 'var(--accent)' : 'transparent',
            color: isActive ? 'var(--accent-contrast)' : 'var(--text-muted)',
          })}
        >
          <span aria-hidden className="text-base">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r p-5 h-screen sticky top-0"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="font-display text-lg">
            gym<span style={{ color: 'var(--accent)' }}>_</span>frek
          </span>
        </div>
        <p className="text-xs uppercase tracking-wide mb-8 px-1" style={{ color: 'var(--accent)' }}>
          Platform Admin
        </p>
        <NavItems />
        <div className="mt-auto pt-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          gym_frek © {new Date().getFullYear()}
        </div>
      </aside>

      <div
        className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <span className="font-display text-lg">
          gym<span style={{ color: 'var(--accent)' }}>_</span>frek <span className="text-xs" style={{ color: 'var(--accent)' }}>admin</span>
        </span>
        <button type="button" className="btn-icon" onClick={() => setMobileOpen(true)} aria-label="Open navigation menu">☰</button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-72 p-5 flex flex-col"
            style={{ backgroundColor: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-display text-lg">
                gym<span style={{ color: 'var(--accent)' }}>_</span>frek
              </span>
              <button type="button" className="btn-icon" onClick={() => setMobileOpen(false)} aria-label="Close navigation menu">✕</button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}