import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMembers, deleteMember as apiDeleteMember } from '../../api/members';
import { fetchPlans } from '../../api/plans';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import MemberFormModal from '../../components/MemberFormModal';
import AssignPlanModal from '../../components/AssignPlanModal';
import AssignPersonalTrainingModal from '../../components/AssignPersonalTrainingModal';
import MemberHistoryModal from '../../components/MemberHistoryModal';
import InvoiceModal from '../../components/InvoiceModal';
import type { Member, MemberFilters, MembershipPlan, PaginationMeta } from '../../types';

// Local extension for PT fields not yet present on the Member type.
type MemberWithPT = Member & {
  activeTrainingPlanName?: string | null;
  activeTrainingTrainerName?: string | null;
  activeTrainingPlanEndDate?: string | null;
};

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function MembersPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<MemberFilters['status']>('');
  const [planId, setPlanId] = useState('');
  const [joinFrom, setJoinFrom] = useState('');
  const [joinTo, setJoinTo] = useState('');
  const [sortBy, setSortBy] = useState<MemberFilters['sortBy']>('joinDate');
  const [sortDir, setSortDir] = useState<MemberFilters['sortDir']>('desc');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [assignTarget, setAssignTarget] = useState<Member | null>(null);
  const [assignPTTarget, setAssignPTTarget] = useState<Member | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Member | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMembers({
        search: debouncedSearch || undefined,
        status: status || undefined,
        planId: planId || undefined,
        joinFrom: joinFrom || undefined,
        joinTo: joinTo || undefined,
        sortBy,
        sortDir,
        page,
        limit: 15,
      });
      setMembers(res.members);
      setPagination(res.pagination);
    } catch {
      showToast('Could not load members.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, planId, joinFrom, joinTo, sortBy, sortDir, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchPlans().then(setPlans).catch(() => {}); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, status, planId, joinFrom, joinTo, sortBy, sortDir]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingMember(null);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteMember(deleteTarget.id);
      showToast('Member deleted.', 'success');
      setDeleteTarget(null);
      load();
    } catch {
      showToast('Could not delete this member.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Members</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {pagination ? `${pagination.total} member${pagination.total === 1 ? '' : 's'}` : 'Loading…'}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ width: 'auto' }}
          onClick={() => { setEditingMember(null); setFormOpen(true); }}
        >
          + Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="label-eyebrow" htmlFor="search">Search</label>
            <input id="search" className="input-field" placeholder="Name, mobile, or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="statusFilter">Status</label>
            <select id="statusFilter" className="input-field" value={status} onChange={(e) => setStatus(e.target.value as MemberFilters['status'])}>
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="planFilter">Plan</label>
            <select id="planFilter" className="input-field" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">All</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="joinFrom">Joined After</label>
            <input id="joinFrom" type="date" className="input-field" value={joinFrom} onChange={(e) => setJoinFrom(e.target.value)} />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="joinTo">Joined Before</label>
            <input id="joinTo" type="date" className="input-field" value={joinTo} onChange={(e) => setJoinTo(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="label-eyebrow mb-0" htmlFor="sortBy">Sort by</label>
          <select id="sortBy" className="input-field w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value as MemberFilters['sortBy'])}>
            <option value="joinDate">Join Date</option>
            <option value="name">Name</option>
            <option value="fee">Fee</option>
          </select>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            aria-label="Toggle sort direction"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14" />)}
  </div>
) : members.length === 0 ? (
  <EmptyState
    title="No members found"
    description="Try adjusting your filters, or add your first member to get started."
    action={<button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={() => { setEditingMember(null); setFormOpen(true); }}>+ Add Member</button>}
  />
) : (
  <>
    {/* Mobile card list */}
    <div className="md:hidden space-y-3">
      {members.map((m) => (
        <div key={m.id} className="card">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
              {m.photoUrl ? <img src={m.photoUrl} alt="" className="w-full h-full object-cover" /> : m.fullName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{m.fullName}</p>
                <span className={`badge badge-${m.membershipStatus.toLowerCase()} shrink-0`}>{m.membershipStatus}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.mobile}</p>
              {m.email && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.email}</p>}

              {m.activePlanName ? (
                <p className="text-xs mt-1">
                  {m.activePlanName}
                  {m.activePlanEndDate && <span style={{ color: 'var(--text-muted)' }}> · till {new Date(m.activePlanEndDate).toLocaleDateString()}</span>}
                </p>
              ) : (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No active plan</p>
              )}
              {(m as MemberWithPT).activeTrainingPlanName && (
                <p className="text-xs mt-0.5" style={{ color: '#FFB43C' }}>
                  PT: {(m as MemberWithPT).activeTrainingTrainerName}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Joined {new Date(m.joinDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={() => setInvoiceTarget(m)}>View</button>
            <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={() => setHistoryTarget(m)}>History</button>
            <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={() => setAssignTarget(m)}>Assign Plan</button>
            <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={() => setAssignPTTarget(m)}>Assign PT</button>
            <button type="button" className="btn-icon ml-auto" onClick={() => { setEditingMember(m); setFormOpen(true); }} aria-label={`Edit ${m.fullName}`}>✎</button>
            <button type="button" className="btn-icon" onClick={() => setDeleteTarget(m)} aria-label={`Delete ${m.fullName}`} style={{ color: 'var(--danger)' }}>🗑</button>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop table */}
    <div className="hidden md:block card overflow-x-auto p-0">
      <table className="table-shell">
        {/* ...unchanged table exactly as you have it... */}
      </table>
    </div>
  </>
)}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1}>Previous</button>
            <button type="button" className="btn-secondary" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages}>Next</button>
          </div>
        </div>
      )}

      <MemberFormModal
        open={formOpen}
        member={editingMember}
        onClose={() => setFormOpen(false)}
        onSaved={() => { showToast(editingMember ? 'Member updated.' : 'Member added.', 'success'); load(); }}
      />

      <AssignPlanModal
        open={!!assignTarget}
        member={assignTarget}
        plans={plans}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => { showToast('Plan assigned.', 'success'); load(); }}
      />

      <AssignPersonalTrainingModal
        open={!!assignPTTarget}
        member={assignPTTarget}
        plans={plans}
        onClose={() => setAssignPTTarget(null)}
        onAssigned={() => { showToast('Personal training assigned.', 'success'); load(); }}
      />

      <MemberHistoryModal
        open={!!historyTarget}
        member={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />

      <InvoiceModal
        open={!!invoiceTarget}
        member={invoiceTarget}
        onClose={() => setInvoiceTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete member?"
        message={`This will permanently remove ${deleteTarget?.fullName} and their plan history. This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}