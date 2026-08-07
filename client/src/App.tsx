import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GymProvider, useGym } from './context/GymContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import { RequireGym, RequireNoGym } from './components/GymGates';
import { RequireAdmin } from './components/AdminGates';
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import PulseLoader from './components/PulseLoader';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import RegisterGym from './pages/gym/RegisterGym';
import GymSettings from './pages/gym/GymSettings';
import Dashboard from './pages/Dashboard';
import MembersPage from './pages/members/MembersPage';
import PlansPage from './pages/plans/PlansPage';
import DuesPage from './pages/DuesPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminGymsPage from './pages/admin/AdminGymsPage';
import AdminGymDetailPage from './pages/admin/AdminGymDetailPage';
import InvoiceModal from './components/InvoiceModal';
import Support from './pages/support';
import Notifications from './pages/Notifications';
import AdminTicketsPage from './pages/admin/AdminTicketsPage'
import AdminPersonalTrainingPage from './pages/admin/AdminPersonalTrainingPage';

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <PulseLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

// Landing route: admins go straight to the admin panel. Gym owners go to
// their dashboard, or to the registration wizard if they haven't
// registered a gym yet.
function RootRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { gym, loading: gymLoading } = useGym();
  if (authLoading || gymLoading) return <PulseLoader />;
  if (user?.role === 'admin') return <Navigate to="/admin/overview" replace />;
  return <Navigate to={gym ? '/dashboard' : '/register-gym'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register-gym"
        element={
          <ProtectedRoute>
            <RequireNoGym>
              <RegisterGym />
            </RequireNoGym>
          </ProtectedRoute>
        }
      />

      {/* Gym owner app */}
      <Route
        element={
          <ProtectedRoute>
            <RequireGym>
              <AppLayout />
            </RequireGym>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/dues" element={<DuesPage />} />
        <Route path="/gym-settings" element={<GymSettings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/support" element={<Support />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/invoice/:memberId" element={<InvoiceModal open={true} member={null} onClose={() => {}} />} />
          <Route path="/admin/personal-training" element={<AdminPersonalTrainingPage />} />
      </Route>

      {/* Platform admin panel */}
      <Route
        element={
          <ProtectedRoute>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </ProtectedRoute>
        }
      >
        <Route path="/admin/overview" element={<AdminOverviewPage />} />
        <Route path="/admin/gyms" element={<AdminGymsPage />} />
        <Route path="/admin/gyms/:gymId" element={<AdminGymDetailPage />} />
        <Route path="/admin/tickets" element={<AdminTicketsPage />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RootRedirect />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <GymProvider>
              <NotificationProvider>
                <AppRoutes />
              </NotificationProvider>
            </GymProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}