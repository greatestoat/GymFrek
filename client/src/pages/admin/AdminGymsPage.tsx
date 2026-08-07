import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// import { fetchAdminGyms, setOwnerStatus } from '../../api/admin';
import { fetchAdminGyms, setOwnerStatus } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import ResetOwnerPasswordModal from '../../components/ResetOwnerPasswordModal';
import type { AdminGymSummary } from '../../types';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function AdminGymsPage() {
  const { showToast } = useToast();
  const [gyms, setGyms] = useState<AdminGymSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [statusTarget, setStatusTarget] = useState<AdminGymSummary | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<AdminGymSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGyms(await fetchAdminGyms());
    } catch {
      showToast('Could not load gyms.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = gyms.filter((g) => {
    const q = search.toLowerCase();
    return !q || g.gymName.toLowerCase().includes(q) || g.owner.name.toLowerCase().includes(q) || g.owner.email.toLowerCase().includes(q);
  });

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    setStatusBusy(true);
    const nextActive = !statusTarget.owner.isActive;
    try {
      await setOwnerStatus(statusTarget.owner.id, nextActive);
      showToast(nextActive ? `${statusTarget.owner.name}'s account reactivated.` : `${statusTarget.owner.name}'s account deactivated.`, 'success');
      setStatusTarget(null);
      load();
    } catch {
      showToast('Could not update this account.', 'error');
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Registered Gyms</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {gyms.length} gym{gyms.length === 1 ? '' : 's'} registered.
          </p>
        </div>
        <input
          className="input-field sm:w-72"
          placeholder="Search by gym or owner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No gyms found" description="No gyms match your search, or none have registered yet." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-shell">
            <thead>
              <tr>
                <th>Gym</th>
                <th>Owner</th>
                <th>Members</th>
                <th>Revenue</th>
                <th>Owner Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.gymId}>
                  <td>
                    <Link to={`/admin/gyms/${g.gymId}`} className="font-medium hover:underline">{g.gymName}</Link>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.city}, {g.state}</p>
                  </td>
                  <td>
                    <p>{g.owner.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.owner.email}</p>
                  </td>
                  <td>{g.activeMemberCount} / {g.memberCount} active</td>
                  <td>
                    <p className="font-semibold">{formatCurrency(g.revenue.total)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(g.revenue.thisMonth)} this month</p>
                  </td>
                  <td>
                    <span className={`badge ${g.owner.isActive ? 'badge-active' : 'badge-expired'}`}>
                      {g.owner.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Link to={`/admin/gyms/${g.gymId}`} className="btn-secondary text-xs px-3 py-1.5">View</Link>
                      <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={() => setPasswordTarget(g)}>Reset Password</button>
                      <button
                        type="button"
                        className={g.owner.isActive ? 'btn-danger text-xs px-3 py-1.5' : 'btn-primary text-xs px-3 py-1.5'}
                        style={{ width: 'auto' }}
                        onClick={() => setStatusTarget(g)}
                      >
                        {g.owner.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget?.owner.isActive ? 'Deactivate this account?' : 'Reactivate this account?'}
        message={
          statusTarget?.owner.isActive
            ? `${statusTarget?.owner.name} will be logged out and unable to log back in to ${statusTarget?.gymName} until reactivated.`
            : `${statusTarget?.owner.name} will be able to log back in to ${statusTarget?.gymName} immediately.`
        }
        confirmLabel={statusTarget?.owner.isActive ? 'Deactivate' : 'Activate'}
        danger={statusTarget?.owner.isActive}
        busy={statusBusy}
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusTarget(null)}
      />

      <ResetOwnerPasswordModal
        open={!!passwordTarget}
        ownerId={passwordTarget?.owner.id || null}
        ownerName={passwordTarget?.owner.name || ''}
        onClose={() => setPasswordTarget(null)}
        onDone={() => showToast('Password updated.', 'success')}
      />
    </div>
  );
}
