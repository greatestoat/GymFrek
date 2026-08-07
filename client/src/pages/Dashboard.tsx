import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { fetchDashboardSummary } from '../api/dashboard';
import { useGym } from '../context/GymContext';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import type { DashboardSummary } from '../types';

const PLAN_COLORS = ['#C6FF3D', '#4DA3FF', '#FF9F4D', '#FF4D4D', '#B98BFF', '#4DFFD5'];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Dashboard() {
  const { gym } = useGym();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardSummary()
      .then((res) => !cancelled && setData(res))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-72" />
      </div>
    );
  }

  if (!data) return null;

  const { totals, revenue, newMembersThisMonth, recentRegistrations, upcomingExpirations, planDistribution, recentActivity, revenueTrend } = data;
  const hasPlanData = planDistribution.some((p) => p.memberCount > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">{gym?.name}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Here's how your gym is doing.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/members?new=1" className="btn-primary" style={{ width: 'auto' }}>+ Add Member</Link>
          <Link to="/plans?new=1" className="btn-secondary">+ New Plan</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={totals.totalMembers} icon="◍" />
        <StatCard label="Active Members" value={totals.activeMembers} icon="●" accent />
        <StatCard label="Expired Memberships" value={totals.expiredMembers} icon="◔" />
        <StatCard label="New This Month" value={newMembersThisMonth} icon="＋" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(revenue.total)} icon="₹" />
        <StatCard label="Revenue This Month" value={formatCurrency(revenue.thisMonth)} icon="₹" accent />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <p className="label-eyebrow mb-4">Monthly Revenue (last 6 months)</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="revenue" stroke="#C6FF3D" fill="url(#revFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="label-eyebrow mb-4">Membership by Plan</p>
          {hasPlanData ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planDistribution.filter((p) => p.memberCount > 0)}
                  dataKey="memberCount"
                  nameKey="planName"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {planDistribution.filter((p) => p.memberCount > 0).map((_, i) => (
                    <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: 'var(--text-muted)' }}>
              Assign plans to members to see distribution.
            </p>
          )}
          <div className="space-y-1.5 mt-2">
            {planDistribution.filter((p) => p.memberCount > 0).slice(0, 5).map((p, i) => (
              <div key={p.planId} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                  {p.planName}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{p.memberCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent registrations */}
        <div className="card">
          <p className="label-eyebrow mb-4">Recent Registrations</p>
          {recentRegistrations.length === 0 ? (
            <EmptyState title="No members yet" description="New sign-ups will show up here." />
          ) : (
            <ul className="space-y-3">
              {recentRegistrations.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: 'var(--surface-2)' }}>
                    {m.fullName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.fullName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Joined {new Date(m.joinDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge badge-${m.membershipStatus.toLowerCase()}`}>{m.membershipStatus}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming expirations */}
        <div className="card">
          <p className="label-eyebrow mb-4">Upcoming Expirations (30 days)</p>
          {upcomingExpirations.length === 0 ? (
            <EmptyState title="All clear" description="No memberships expiring in the next 30 days." />
          ) : (
            <ul className="space-y-3">
              {upcomingExpirations.map((u) => (
                <li key={u.assignmentId} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.fullName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.planName}</p>
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--danger)' }}>
                    {new Date(u.endDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <p className="label-eyebrow mb-4">Recent Activity</p>
          {recentActivity.length === 0 ? (
            <EmptyState title="No activity yet" description="Actions across your gym will appear here." />
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((a, i) => (
                <li key={`${a.type}-${a.refId}-${i}`} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.type === 'payment_received' ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <p className="text-sm flex-1 min-w-0 truncate">
                    {a.type === 'payment_received' ? 'Payment received from ' : 'New member: '}
                    <span className="font-medium">{a.label}</span>
                  </p>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(a.occurredAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
