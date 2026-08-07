import { useEffect, useState, useCallback } from 'react';
import {
  listTickets,
  updateTicketStatus,
  getTicketDetails,
} from '../../api/tickets';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import TicketDetailModal from '../../components/TicketDetailModal';
import type { Ticket, TicketStatus, TicketType } from '../../types';

const TYPE_TABS: { label: string; value: TicketType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Support', value: 'support' },
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
];

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  open: 'badge-expired',
  in_progress: 'badge-paused',
  resolved: 'badge-active',
};

function formatDate(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminTicketsPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState<TicketType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTickets({
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter || undefined,
      });
      setTickets(data);
    } catch {
      showToast('Could not load tickets.', 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    const previous = tickets;
    setTickets((prev) => prev.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket)));
    try {
      await updateTicketStatus(id, status);
    } catch {
      setTickets(previous);
      showToast('Could not update ticket status.', 'error');
    }
  };

  const openTicketDetails = async (id: string) => {
    setDetailLoading(true);
    try {
      const ticket = await getTicketDetails(id);
      setSelectedTicket(ticket);
    } catch {
      showToast('Could not load ticket details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // Keep both the modal's ticket and the underlying list row in sync once a
  // reply goes out, so the "Answered" state and status badge update live.
  const handleReplied = (updated: Ticket) => {
    setSelectedTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl mb-1" style={{ color: 'var(--text)' }}>
            Tickets
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Support requests, bug reports, and feature suggestions from gym owners.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTypeFilter(tab.value)}
                className="badge transition"
                style={{
                  backgroundColor: typeFilter === tab.value ? 'var(--accent)' : 'var(--surface-2)',
                  color: typeFilter === tab.value ? 'var(--accent-contrast)' : 'var(--text)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            className="input-field w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState title="No tickets" description="Nothing matches these filters yet." />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Received</th>
                  <th>Replied</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="capitalize">{ticket.type}</td>

                    <td>
                      <button
                        type="button"
                        onClick={() => openTicketDetails(ticket.id)}
                        className="font-medium hover:underline text-left"
                        style={{ color: 'inherit' }}
                        disabled={detailLoading}
                      >
                        {ticket.name || '—'}
                      </button>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {ticket.gymName || ticket.email || ''}
                      </div>
                    </td>

                    <td>{ticket.subject || '—'}</td>

                    <td className="max-w-xs">
                      <p className="truncate" title={ticket.message}>
                        {ticket.message}
                      </p>
                    </td>

                    <td className="whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(ticket.createdAt)}
                    </td>

                    <td>
                      {ticket.adminReply ? (
                        <span className="badge badge-active border-0">Answered</span>
                      ) : (
                        <span className="badge border-0" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                          Not yet
                        </span>
                      )}
                    </td>

                    <td>
                      <select
                        className={`badge ${STATUS_BADGE_CLASS[ticket.status]} border-0`}
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                        aria-label={`Update status for ticket ${ticket.subject || ticket.id}`}
                      >
                        <option value="open">{STATUS_LABEL.open}</option>
                        <option value="in_progress">{STATUS_LABEL.in_progress}</option>
                        <option value="resolved">{STATUS_LABEL.resolved}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TicketDetailModal
        open={!!selectedTicket}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onReplied={handleReplied}
      />
    </>
  );
}