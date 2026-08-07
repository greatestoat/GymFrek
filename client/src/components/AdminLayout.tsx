import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page-shell flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <header
          className="hidden lg:flex items-center justify-end gap-3 px-8 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <button type="button" onClick={toggleTheme} className="btn-icon" aria-label="Toggle dark or light theme" title="Toggle theme">
            {theme === 'dark' ? '☾' : '☀'}
          </button>
          <div className="flex items-center gap-2 pl-2">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ backgroundColor: user?.avatarColor || 'var(--accent)', color: '#0B0D0F' }}
            >
              {user?.name?.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
          <button type="button" className="btn-secondary" onClick={handleLogout}>Log out</button>
        </header>

        <div className="lg:hidden flex items-center justify-end gap-2 px-4 py-2">
          <button type="button" onClick={toggleTheme} className="btn-icon" aria-label="Toggle dark or light theme">
            {theme === 'dark' ? '☾' : '☀'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleLogout}>Log out</button>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
