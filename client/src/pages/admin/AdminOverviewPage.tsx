import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminOverview } from '../../api/admin';
import StatCard from '../../components/StatCard';
import type { AdminOverview } from '../../types';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAdminOverview().then((res) => !cancelled && setData(res)).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Platform Overview</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Every gym registered on gym_frek, at a glance.
          </p>
        </div>
        <Link to="/admin/gyms" className="btn-primary" style={{ width: 'auto' }}>View All Gyms</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Registered Gyms" value={data.totalGyms} icon="⌂" accent />
        <StatCard label="Active Owners" value={data.owners.active} hint={`${data.owners.inactive} deactivated`} icon="●" />
        <StatCard label="Total Members (all gyms)" value={data.members.total} hint={`${data.members.active} currently active`} icon="◍" />
        <StatCard label="Revenue Collected" value={formatCurrency(data.revenue.total)} hint={`${formatCurrency(data.revenue.thisMonth)} this month`} icon="₹" />
      </div>

      <div className="card">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          "Revenue Collected" reflects payments recorded against plan assignments across every gym.
          The platform doesn't track gym expenses (rent, staff, equipment), so this is income only,
          not profit or loss — that would need expense data this system doesn't currently capture.
        </p>
      </div>
    </div>
  );
}
