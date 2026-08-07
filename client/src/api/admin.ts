import api from './axios';
import type { AdminOverview, AdminGymSummary, AdminGymDetail, AdminPersonalTrainingItem } from '../types';

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const { data } = await api.get<AdminOverview>('/admin/overview');
  return data;
}

export async function fetchAdminGyms(): Promise<AdminGymSummary[]> {
  const { data } = await api.get<{ gyms: AdminGymSummary[] }>('/admin/gyms');
  return data.gyms;
}

export async function fetchAdminGymDetail(gymId: string): Promise<AdminGymDetail> {
  const { data } = await api.get<AdminGymDetail>(`/admin/gyms/${gymId}`);
  return data;
}

export async function setOwnerStatus(ownerId: string, isActive: boolean): Promise<void> {
  await api.patch(`/admin/owners/${ownerId}/status`, { isActive });
}

export async function setOwnerPassword(ownerId: string, newPassword: string): Promise<void> {
  await api.patch(`/admin/owners/${ownerId}/password`, { newPassword });
}
export async function fetchAdminPersonalTraining(status?: string): Promise<AdminPersonalTrainingItem[]> {
  const { data } = await api.get<{ registrations: AdminPersonalTrainingItem[] }>('/admin/personal-training', {
    params: status ? { status } : undefined,
  });
  return data.registrations;
}