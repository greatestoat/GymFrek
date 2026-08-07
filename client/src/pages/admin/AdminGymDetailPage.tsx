import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchAdminGymDetail, setOwnerStatus } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import ResetOwnerPasswordModal from '../../components/ResetOwnerPasswordModal';
import StatCard from '../../components/StatCard';
import type { AdminGymDetail } from '../../types';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function AdminGymDetailPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const { showToast } = useToast();
  const [data, setData] = useState<AdminGymDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    try {
      setData(await fetchAdminGymDetail(gymId));
    } catch {
      showToast('Could not load this gym.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async () => {
    if (!data) return;
    setStatusBusy(true);
    const nextActive = !data.owner.isActive;
    try {
      await setOwnerStatus(data.owner.id, nextActive);
      showToast(nextActive ? 'Account reactivated.' : 'Account deactivated.', 'success');
      setConfirmOpen(false);
      load();
    } catch {
      showToast('Could not update this account.', 'error');
    } finally {
      setStatusBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (!data) return null;
  const { gym, owner, members, plans, revenue, personalTraining } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/gyms" className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>← All Gyms</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">{gym.name}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{gym.address}, {gym.city}, {gym.state}</p>
          <p className="text-sm mt-1">
            Owner: <strong>{owner.name}</strong> · {owner.email}
            <span className={`badge ml-2 ${owner.isActive ? 'badge-active' : 'badge-expired'}`}>
              {owner.isActive ? 'Active' : 'Deactivated'}
            </span>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" className="btn-secondary" onClick={() => setPasswordOpen(true)}>Reset Password</button>
          <button
            type="button"
            className={owner.isActive ? 'btn-danger' : 'btn-primary'}
            style={{ width: 'auto' }}
            onClick={() => setConfirmOpen(true)}
          >
            {owner.isActive ? 'Deactivate Owner' : 'Activate Owner'}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Members" value={members.length} hint={`${members.filter((m) => m.membershipStatus === 'Active').length} active`} icon="◍" />
        <StatCard label="Plans Offered" value={plans.length} icon="◆" />
        <StatCard label="Revenue Collected" value={formatCurrency(revenue.total)} icon="₹" accent />
      </div>

      <div className="card">
        <p className="label-eyebrow mb-4">Monthly Revenue (last 6 months)</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenue.trend}>
            <defs>
              <linearGradient id="adminRevFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C6FF3D" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#C6FF3D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
              formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : '')}
            />
            <Area type="monotone" dataKey="revenue" stroke="#C6FF3D" fill="url(#adminRevFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <p className="label-eyebrow mb-4">Members ({members.length})</p>
          {members.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No members yet.</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.fullName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {m.activePlanName || 'No active plan'}
                    </p>
                  </div>
                  <span className={`badge badge-${m.membershipStatus.toLowerCase()} shrink-0`}>{m.membershipStatus}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <p className="label-eyebrow mb-4">Plans ({plans.length})</p>
          {plans.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No plans created yet.</p>
          ) : (
            <ul className="space-y-3">
              {plans.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>₹{p.finalPrice} / {p.durationMonths}mo · {p.activeMemberCount} active</p>
                  </div>
                  <span className="badge" style={{ backgroundColor: p.isActive ? 'rgba(198,255,61,0.15)' : 'rgba(139,145,152,0.2)', color: p.isActive ? '#C6FF3D' : 'var(--text-muted)' }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card lg:col-span-2">
          <p className="label-eyebrow mb-4">Personal Training ({personalTraining.length})</p>
          {personalTraining.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No one is registered for personal training yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-shell">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Trainer</th>
                    <th>Fee</th>
                    <th>Valid Till</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {personalTraining.map((pt) => (
                    <tr key={pt.assignmentId}>
                      <td>{pt.memberName}</td>
                      <td>
                        <div>
                          <p>{pt.trainerName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pt.trainerMobile}</p>
                        </div>
                      </td>
                      <td>₹{pt.trainerFee}</td>
                      <td>{new Date(pt.endDate).toLocaleDateString()}</td>
                      <td><span className={`badge badge-${pt.status.toLowerCase()}`}>{pt.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={owner.isActive ? 'Deactivate this account?' : 'Reactivate this account?'}
        message={
          owner.isActive
            ? `${owner.name} will be logged out and unable to log back in to ${gym.name} until reactivated.`
            : `${owner.name} will be able to log back in to ${gym.name} immediately.`
        }
        confirmLabel={owner.isActive ? 'Deactivate' : 'Activate'}
        danger={owner.isActive}
        busy={statusBusy}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmOpen(false)}
      />

      <ResetOwnerPasswordModal
        open={passwordOpen}
        ownerId={owner.id}
        ownerName={owner.name}
        onClose={() => setPasswordOpen(false)}
        onDone={() => showToast('Password updated.', 'success')}
      />
    </div>
  );
}
