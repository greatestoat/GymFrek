import api from './axios';
import type { DashboardSummary } from '../types';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary');
  return data;
}
