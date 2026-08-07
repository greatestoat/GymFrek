import api from './axios';
import type { Member, MemberFormInput, MemberFilters, MemberListResponse, PlanAssignmentHistoryItem } from '../types';

export async function fetchMembers(filters: MemberFilters): Promise<MemberListResponse> {
  const { data } = await api.get<MemberListResponse>('/members', { params: filters });
  return data;
}

export async function fetchMember(id: string): Promise<Member> {
  const { data } = await api.get<{ member: Member }>(`/members/${id}`);
  return data.member;
}

export async function createMember(input: MemberFormInput): Promise<Member> {
  const { data } = await api.post<{ member: Member }>('/members', input);
  return data.member;
}

export async function updateMember(id: string, input: Partial<MemberFormInput>): Promise<Member> {
  const { data } = await api.patch<{ member: Member }>(`/members/${id}`, input);
  return data.member;
}

export async function deleteMember(id: string): Promise<void> {
  await api.delete(`/members/${id}`);
}

export async function fetchMemberAssignments(id: string): Promise<PlanAssignmentHistoryItem[]> {
  const { data } = await api.get<{ assignments: PlanAssignmentHistoryItem[] }>(`/members/${id}/assignments`);
  return data.assignments;
}

export async function uploadMemberPhoto(id: string, file: File): Promise<Member> {
  const form = new FormData();
  form.append('photo', file);
  const { data } = await api.post<{ member: Member }>(`/members/${id}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.member;
}
