import api from './axios';
import type { DuesResponse } from '../types';

export async function fetchDues(): Promise<DuesResponse> {
  const { data } = await api.get<DuesResponse>('/dues');
  return data;
}
