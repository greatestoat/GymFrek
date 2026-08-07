import { useEffect, useState } from 'react';
import Modal from './Modal';
import { fetchMemberAssignments } from '../api/members';
import type { Member, PlanAssignmentHistoryItem } from '../types';

interface MemberHistoryModalProps {
  open: boolean;
  member: Member | null;
  onClose: () => void;
}

const STATUS_COLOR: Record<PlanAssignmentHistoryItem['status'], string> = {
  Active: '#C6FF3D',
  Expired: '#FF4D4D',
  Cancelled: '#8B9198',
};

export default function MemberHistoryModal({ open, member, onClose }: MemberHistoryModalProps) {
  const [items, setItems] = useState<PlanAssignmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !member) return;
    setLoading(true);
    fetchMemberAssignments(member.id)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open, member]);

  if (!member) return null;

  // "Current" badge is per-type, not just the first row overall — a member
  // can have a current Membership AND a current Personal Training package
  // at once.
  const firstActiveIndexByType: Record<string, number> = {};
  items.forEach((a, i) => {
    if (a.status === 'Active' && firstActiveIndexByType[a.planType] === undefined) {
      firstActiveIndexByType[a.planType] = i;
    }
  });

  return (
    <Modal open={open} title={`Plan History — ${member.fullName}`} onClose={onClose} maxWidthClass="max-w-lg">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
          No plans have been assigned to this member yet.
        </p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((a, i) => {
            const isPT = a.planType === 'personal_training';
            const isCurrent = firstActiveIndexByType[a.planType] === i && a.status === 'Active';
            return (
              <li key={a.id} className="rounded-lg p-3.5 flex items-start justify-between gap-3" style={{ backgroundColor: 'var(--surface-2)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                    {a.planName}
                    <span className="badge" style={{ backgroundColor: isPT ? 'rgba(255,180,60,0.15)' : 'rgba(198,255,61,0.15)', color: isPT ? '#FFB43C' : '#C6FF3D' }}>
                      {isPT ? 'Personal Training' : 'Membership'}
                    </span>
                    {isCurrent && <span className="badge badge-active">Current</span>}
                  </p>
                  {isPT && a.trainerName && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Trainer: {a.trainerName} · {a.trainerMobile}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {new Date(a.startDate).toLocaleDateString()} → {new Date(a.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">₹{a.pricePaid}</p>
                  <p className="text-xs mt-1" style={{ color: STATUS_COLOR[a.status] }}>{a.status}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}