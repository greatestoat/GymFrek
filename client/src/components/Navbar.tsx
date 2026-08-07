import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="border-b border-white/5 bg-ink/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-lg text-chalk tracking-tight">
          GYM<span className="text-volt">_</span>FREK
        </Link>

        {user && (
          <div className="flex items-center gap-5">
            <Link
              to="/"
              className="text-sm text-mist hover:text-chalk transition-colors"
            >
              Home
            </Link>
            <Link
              to="/profile"
              className="text-sm text-mist hover:text-chalk transition-colors"
            >
              Profile
            </Link>
            <Link
              to="/support"
              className="text-sm text-mist hover:text-chalk transition-colors"
            >
              Support &amp; Help
            </Link>

            <NotificationBell />

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink font-bold text-sm"
              style={{ backgroundColor: user.avatarColor }}
              aria-hidden="true"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-pulse hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}