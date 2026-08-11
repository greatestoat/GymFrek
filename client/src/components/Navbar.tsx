import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const links = [
    { to: '/', label: 'Home' },
    { to: '/profile', label: 'Profile' },
    { to: '/support', label: 'Support & Help' },
  ];

  return (
    <nav className="border-b border-white/5 bg-ink/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-lg text-chalk tracking-tight">
          GYM<span className="text-volt">_</span>FREK
        </Link>

        {user && (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-5">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-mist hover:text-chalk transition-colors">
                  {l.label}
                </Link>
              ))}
              <NotificationBell />
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink font-bold text-sm"
                style={{ backgroundColor: user.avatarColor }}
                aria-hidden="true"
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} className="text-sm font-semibold text-pulse hover:text-white transition-colors">
                Log out
              </button>
            </div>

            {/* Mobile: bell + hamburger */}
            <div className="flex md:hidden items-center gap-3">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="p-2 -mr-2"
              >
                <Menu size={22} className="text-chalk" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-ink p-5 flex flex-col gap-1 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink font-bold text-sm"
                style={{ backgroundColor: user?.avatarColor }}
              >
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1">
                <X size={20} className="text-chalk" />
              </button>
            </div>
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm text-mist hover:text-chalk py-2.5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => { setOpen(false); handleLogout(); }}
              className="text-sm font-semibold text-pulse hover:text-white py-2.5 text-left mt-2 border-t border-white/10 pt-4"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}