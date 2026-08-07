import { useCallback, useEffect, useState } from 'react';
import { fetchDues } from '../api/dues';
import { fetchPlans } from '../api/plans';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import AssignPlanModal from '../components/AssignPlanModal';
import StatCard from '../components/StatCard';
import type { DuesResponse, Member, MembershipPlan, UnpaidMember } from '../types';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

// AssignPlanModal expects a full Member - the dues list only carries a
// subset of fields, so we adapt what we have into the shape it needs.
function toMemberStub(u: UnpaidMember): Member {
  return {
    id: u.id,
    fullName: u.fullName,
    mobile: u.mobile,
    email: u.email,
    gender: null,
    dateOfBirth: null,
    address: null,
    emergencyContact: null,
    heightCm: null,
    weightKg: null,
    medicalNotes: null,
    joinDate: u.joinDate,
    membershipStatus: 'Expired',
    photoUrl: u.photoUrl,
    activePlanName: null,
    activePlanEndDate: null,
    activePlanFee: null,
    createdAt: u.joinDate,
  };
}

export default function DuesPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<DuesResponse | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [collectTarget, setCollectTarget] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchDues());
    } catch {
      showToast('Could not load dues.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchPlans().then(setPlans).catch(() => {}); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-56" />
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-72" />
      </div>
    );
  }

  if (!data) return null;

  const { paid, unpaid, summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Dues</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Who's paid, who's due, and what to collect this period.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Paid Members" value={summary.paidCount} icon="●" accent />
        <StatCard label="Due / Unpaid" value={summary.unpaidCount} icon="◔" />
        <StatCard label="Collected This Period" value={formatCurrency(summary.collectedThisPeriod)} icon="₹" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        {(['unpaid', 'paid'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition"
            style={{
              borderColor: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {t === 'unpaid' ? `Due (${unpaid.length})` : `Paid (${paid.length})`}
          </button>
        ))}
      </div>

      {tab === 'unpaid' && (
        unpaid.length === 0 ? (
          <EmptyState title="Everyone's paid up" description="No members currently owe a renewal." />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Mobile</th>
                  <th>Last Plan</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {unpaid.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                          {u.photoUrl ? <img src={u.photoUrl} alt="" className="w-full h-full object-cover" /> : u.fullName.slice(0, 1).toUpperCase()}
                        </span>
                        <p className="font-medium truncate">{u.fullName}</p>
                      </div>
                    </td>
                    <td>{u.mobile}</td>
                    <td>
                      {u.lastPlanName ? (
                        <div>
                          <p>{u.lastPlanName}</p>
                          {u.lastEndDate && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>expired {new Date(u.lastEndDate).toLocaleDateString()}</p>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-expired">
                        {u.reason === 'never_subscribed' ? 'Never subscribed' : 'Renewal due'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button type="button" className="btn-primary text-xs px-3 py-1.5" style={{ width: 'auto' }} onClick={() => setCollectTarget(toMemberStub(u))}>
                        Collect / Assign Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'paid' && (
        paid.length === 0 ? (
          <EmptyState title="No paid members yet" description="Members with an active plan will show up here." />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Mobile</th>
                  <th>Plan</th>
                  <th>Valid Until</th>
                  <th className="text-right">Paid</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                          {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : p.fullName.slice(0, 1).toUpperCase()}
                        </span>
                        <p className="font-medium truncate">{p.fullName}</p>
                      </div>
                    </td>
                    <td>{p.mobile}</td>
                    <td>{p.planName}</td>
                    <td>{new Date(p.endDate).toLocaleDateString()}</td>
                    <td className="text-right font-semibold">{formatCurrency(p.pricePaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <AssignPlanModal
        open={!!collectTarget}
        member={collectTarget}
        plans={plans}
        onClose={() => setCollectTarget(null)}
        onAssigned={() => { showToast('Plan assigned — member marked as paid.', 'success'); load(); }}
      />
    </div>
  );
}
