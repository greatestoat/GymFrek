import api from './axios';
import type { CreateTicketInput, Ticket, TicketStatus, TicketType } from '../types';

// Used by the Support Center page - covers Support, Bug Report, and
// Feature Suggestion forms, distinguished by `type`.
export async function createTicket(input: CreateTicketInput) {
  const { data } = await api.post<{ ticket: Ticket }>('/tickets', input);
  return data.ticket;
}

// The logged-in user's own tickets - backs the "Your Questions" thread on
// the Support page (question + admin's reply, once there is one).
export async function getMyTickets() {
  const { data } = await api.get<{ tickets: Ticket[] }>('/tickets/mine');
  return data.tickets;
}

// Admin-only (backed by requireAdmin on the server).
export async function listTickets(filters: { type?: TicketType; status?: TicketStatus } = {}) {
  const { data } = await api.get<{ tickets: Ticket[] }>('/admin/tickets', { params: filters });
  return data.tickets;
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const { data } = await api.patch<{ ticket: Ticket }>(`/admin/tickets/${id}/status`, { status });
  return data.ticket;
}
export async function getTicketDetails(id: string): Promise<Ticket> {
  const { data } = await api.get<{ ticket: Ticket }>(`/admin/tickets/${id}`);
  return data.ticket;
}

// Admin posts (or edits) the answer to a ticket. This also triggers a
// notification for the ticket's owner on the server side.
export async function replyToTicket(id: string, reply: string) {
  const { data } = await api.patch<{ ticket: Ticket }>(`/admin/tickets/${id}/reply`, { reply });
  return data.ticket;
}