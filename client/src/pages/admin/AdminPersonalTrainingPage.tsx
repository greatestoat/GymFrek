import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminPersonalTraining } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import type { AdminPersonalTrainingItem } from '../../types';

export default function AdminPersonalTrainingPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminPersonalTrainingItem[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchAdminPersonalTraining(status || undefined));
    } catch {
      showToast('Could not load personal training registrations.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Personal Training</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {items.length} registration{items.length === 1 ? '' : 's'} across all gyms.
          </p>
        </div>
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No one is registered for personal training yet.</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-shell">
            <thead>
              <tr>
                <th>Member</th>
                <th>Gym</th>
                <th>Trainer</th>
                <th>Fee</th>
                <th>Valid Till</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((pt) => (
                <tr key={pt.assignmentId}>
                  <td>
                    <div>
                      <p className="font-medium">{pt.memberName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pt.memberMobile}</p>
                    </div>
                  </td>
                  <td>
                    <Link to={`/admin/gyms/${pt.gymId}`} className="hover:underline">{pt.gymName}</Link>
                  </td>
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
  );
}