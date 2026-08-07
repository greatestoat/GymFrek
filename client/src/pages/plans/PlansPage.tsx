import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPlans, deletePlan as apiDeletePlan } from '../../api/plans';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import PlanFormModal from '../../components/PlanFormModal';
import type { MembershipPlan, PlanType } from '../../types';

const TABS: { key: PlanType; label: string }[] = [
  { key: 'membership', label: 'Membership Plans' },
  { key: 'personal_training', label: 'Personal Training' },
];

export default function PlansPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: PlanType = searchParams.get('tab') === 'personal_training' ? 'personal_training' : 'membership';

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MembershipPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await fetchPlans(activeTab));
    } catch {
      showToast('Could not load plans.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingPlan(null);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTab = (tab: PlanType) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeletePlan(deleteTarget.id);
      showToast('Plan deleted.', 'success');
      setDeleteTarget(null);
      load();
    } catch {
      showToast('Could not delete this plan. It may still be assigned to members.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const isPT = activeTab === 'personal_training';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">{isPT ? 'Personal Training' : 'Membership Plans'}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {plans.length} plan{plans.length === 1 ? '' : 's'} · {isPT ? 'packages your trainers offer' : 'create and manage what your gym offers'}.
          </p>
        </div>
        <button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={() => { setEditingPlan(null); setFormOpen(true); }}>
          + New {isPT ? 'Training' : ''} Plan
        </button>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition"
            style={{
              borderColor: activeTab === t.key ? 'var(--accent)' : 'transparent',
              color: activeTab === t.key ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-56" />)}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          title={isPT ? 'No training plans yet' : 'No plans yet'}
          description={isPT
            ? 'Create your first personal training package — 1-on-1 sessions, small group training, or a transformation program.'
            : 'Create your first membership plan — Strength Training, Cardio, CrossFit, or anything your gym offers.'}
          action={<button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={() => { setEditingPlan(null); setFormOpen(true); }}>+ New Plan</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="card flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-display text-lg">{p.name}</h3>
                <span className="badge" style={{ backgroundColor: p.isActive ? 'rgba(198,255,61,0.15)' : 'rgba(139,145,152,0.2)', color: p.isActive ? '#C6FF3D' : 'var(--text-muted)' }}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {p.description && <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{p.description}</p>}

              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-2xl">₹{p.finalPrice}</span>
                {p.discount > 0 && <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>₹{p.price}</span>}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {p.durationMonths}mo</span>
              </div>

              {p.features.length > 0 && (
                <ul className="text-sm space-y-1.5 mb-4 flex-1">
                  {p.features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: 'var(--accent)' }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 mt-auto pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => { setEditingPlan(p); setFormOpen(true); }}>Edit</button>
                <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.name}`}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanFormModal
        open={formOpen}
        plan={editingPlan}
        defaultPlanType={activeTab}
        onClose={() => setFormOpen(false)}
        onSaved={() => { showToast(editingPlan ? 'Plan updated.' : 'Plan created.', 'success'); load(); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete plan?"
        message={`This will permanently remove "${deleteTarget?.name}". Members currently assigned to it will keep their history.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}