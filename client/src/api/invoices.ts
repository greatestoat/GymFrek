
// import api from './axios';

// export interface InvoiceData {
//   assignmentId: string;
//   invoiceNumber: string;
//   issueDate: string;
//   summaryMessage: string;
//   gym: {
//     name: string;
//     address: string;
//     city: string;
//     state: string;
//     pincode: string;
//     mobile: string;
//     email: string;
//     logoUrl: string | null;
//   };
//   member: { fullName: string; mobile: string; email: string | null };
//   plan: { name: string; durationMonths: number; startDate: string; endDate: string };
//   amount: number;
// }

// export async function fetchMemberInvoice(memberId: string): Promise<InvoiceData> {
//   const { data } = await api.get<InvoiceData>(`/members/${memberId}/invoice`);
//   return data;
// }

// export async function updateInvoiceSummary(
//   memberId: string,
//   assignmentId: string,
//   summaryMessage: string
// ): Promise<{ summaryMessage: string }> {
//   const { data } = await api.patch(`/members/${memberId}/invoice`, { assignmentId, summaryMessage });
//   return data;
// }

// // Downloads the PDF through the authenticated axios instance (so the
// // bearer token is sent), then saves it via a temporary blob link.
// // A plain <a href="..."> tag would bypass axios entirely and skip auth.
// export async function downloadInvoicePdf(memberId: string, invoiceNumber?: string): Promise<void> {
//   const response = await api.get(`/members/${memberId}/invoice/pdf`, {
//     responseType: 'blob',
//   });

//   const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
//   const link = document.createElement('a');
//   link.href = blobUrl;
//   link.download = `${invoiceNumber || 'invoice'}.pdf`;
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   window.URL.revokeObjectURL(blobUrl);
// }
import api from './axios';

export interface InvoiceData {
  assignmentId: string;
  invoiceNumber: string;
  issueDate: string;
  summaryMessage: string;
  gym: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    mobile: string;
    email: string;
    logoUrl: string | null;
  };
  member: { fullName: string; mobile: string; email: string | null };
  plan: { name: string; type: 'membership' | 'personal_training'; durationMonths: number; startDate: string; endDate: string };
  trainer: { name: string; mobile: string; fee: number } | null;
  amount: number;
}

export async function fetchMemberInvoice(memberId: string, assignmentId?: string): Promise<InvoiceData> {
  const { data } = await api.get<InvoiceData>(`/members/${memberId}/invoice`, {
    params: assignmentId ? { assignmentId } : undefined,
  });
  return data;
}

export async function updateInvoiceSummary(
  memberId: string,
  assignmentId: string,
  summaryMessage: string
): Promise<{ summaryMessage: string }> {
  const { data } = await api.patch(`/members/${memberId}/invoice`, { assignmentId, summaryMessage });
  return data;
}

export async function downloadInvoicePdf(memberId: string, invoiceNumber?: string, assignmentId?: string): Promise<void> {
  const response = await api.get(`/members/${memberId}/invoice/pdf`, {
    responseType: 'blob',
    params: assignmentId ? { assignmentId } : undefined,
  });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${invoiceNumber || 'invoice'}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}