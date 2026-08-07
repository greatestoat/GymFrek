import { useEffect, useState } from 'react';
import Modal from './Modal';
import { replyToTicket } from '../api/tickets';
import { useToast } from '../context/ToastContext';
import type { Ticket } from '../types';

interface TicketDetailModalProps {
  open: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  // Called after a reply is successfully posted, with the updated ticket -
  // lets the parent list (AdminTicketsPage) update without a full reload.
  onReplied?: (ticket: Ticket) => void;
}

export default function TicketDetailModal({ open, ticket, onClose, onReplied }: TicketDetailModalProps) {
  const { showToast } = useToast();
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReply, setEditingReply] = useState(false);

  // Reset local form state whenever a different ticket is opened.
  useEffect(() => {
    setReplyText(ticket?.adminReply || '');
    setEditingReply(false);
  }, [ticket?.id]);

  if (!ticket) return null;

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await replyToTicket(ticket.id, replyText.trim());
      showToast('Reply sent. The user has been notified.', 'success');
      setEditingReply(false);
      onReplied?.(updated);
    } catch {
      showToast('Could not send the reply.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hasReply = !!ticket.adminReply;

  return (
    <Modal open={open} title={`Ticket — ${ticket.subject || ticket.id}`} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted">Type</p>
            <p className="font-medium capitalize">{ticket.type}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted">Status</p>
            <p className="font-medium capitalize">{ticket.status.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted">Gym</p>
            <p className="font-medium">{ticket.gymName || 'Unknown gym'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted">Owner</p>
            <p className="font-medium">{ticket.name || 'Unknown'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted">Email</p>
            <p className="font-medium">{ticket.email || '—'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted">Phone</p>
            <p className="font-medium">{ticket.gymMobile || '—'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted">Address</p>
          <p className="font-medium">
            {ticket.gymAddress || ticket.gymName ? (
              `${ticket.gymAddress || ''}${ticket.gymCity ? `, ${ticket.gymCity}` : ''}${ticket.gymState ? `, ${ticket.gymState}` : ''}${ticket.gymPincode ? `, ${ticket.gymPincode}` : ''}`
            ) : '—'}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted">Subject</p>
          <p className="font-medium">{ticket.subject || '—'}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted">Message</p>
          <p className="whitespace-pre-wrap">{ticket.message}</p>
        </div>

        {/* Reply thread */}
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm text-muted">Your reply</p>

          {hasReply && !editingReply ? (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
              <p className="whitespace-pre-wrap text-sm">{ticket.adminReply}</p>
              {ticket.repliedAt && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Sent {new Date(ticket.repliedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              <button
                type="button"
                onClick={() => setEditingReply(true)}
                className="text-xs font-medium mt-2 hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                Edit reply
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                className="input-field min-h-24"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your answer to the user's question…"
                aria-label="Reply to ticket"
              />
              <div className="flex gap-2 justify-end">
                {editingReply && (
                  <button
                    type="button"
                    className="badge border-0"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text)' }}
                    onClick={() => {
                      setReplyText(ticket.adminReply || '');
                      setEditingReply(false);
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary"
                  disabled={submitting || !replyText.trim()}
                  onClick={handleSubmitReply}
                >
                  {submitting ? 'Sending…' : hasReply ? 'Update reply' : 'Send reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}