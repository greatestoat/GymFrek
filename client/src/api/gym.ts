import api from './axios';
import type { Gym, GymFormInput } from '../types';

export async function fetchMyGym(): Promise<Gym | null> {
  const { data } = await api.get<{ gym: Gym | null }>('/gym/me');
  return data.gym;
}

export async function registerGym(input: GymFormInput): Promise<Gym> {
  const { data } = await api.post<{ gym: Gym }>('/gym', input);
  return data.gym;
}

export async function updateGym(input: Partial<GymFormInput>): Promise<Gym> {
  const { data } = await api.patch<{ gym: Gym }>('/gym', input);
  return data.gym;
}

export async function uploadGymLogo(file: File): Promise<Gym> {
  const form = new FormData();
  form.append('logo', file);
  const { data } = await api.post<{ gym: Gym }>('/gym/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.gym;
}
