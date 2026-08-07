// import api from './axios';
// import type { MembershipPlan, PlanFormInput, PlanAssignment } from '../types';

// export async function fetchPlans(): Promise<MembershipPlan[]> {
//   const { data } = await api.get<{ plans: MembershipPlan[] }>('/plans');
//   return data.plans;
// }

// export async function createPlan(input: PlanFormInput): Promise<MembershipPlan> {
//   const { data } = await api.post<{ plan: MembershipPlan }>('/plans', input);
//   return data.plan;
// }

// export async function updatePlan(id: string, input: Partial<PlanFormInput>): Promise<MembershipPlan> {
//   const { data } = await api.patch<{ plan: MembershipPlan }>(`/plans/${id}`, input);
//   return data.plan;
// }

// export async function deletePlan(id: string): Promise<void> {
//   await api.delete(`/plans/${id}`);
// }

// export async function assignPlan(payload: {
//   memberId: string;
//   planId: string;
//   startDate?: string;
//   pricePaid?: number;
// }): Promise<PlanAssignment> {
//   const { data } = await api.post<{ assignment: PlanAssignment }>('/plans/assign', payload);
//   return data.assignment;
// }
import api from './axios';
import type { MembershipPlan, PlanFormInput, PlanAssignment, PlanType } from '../types';

export async function fetchPlans(planType?: PlanType): Promise<MembershipPlan[]> {
  const { data } = await api.get<{ plans: MembershipPlan[] }>('/plans', {
    params: planType ? { type: planType } : undefined,
  });
  return data.plans;
}

export async function createPlan(input: PlanFormInput): Promise<MembershipPlan> {
  const { data } = await api.post<{ plan: MembershipPlan }>('/plans', input);
  return data.plan;
}

export async function updatePlan(id: string, input: Partial<PlanFormInput>): Promise<MembershipPlan> {
  const { data } = await api.patch<{ plan: MembershipPlan }>(`/plans/${id}`, input);
  return data.plan;
}

export async function deletePlan(id: string): Promise<void> {
  await api.delete(`/plans/${id}`);
}

export async function assignPlan(payload: {
  memberId: string;
  planId: string;
  startDate?: string;
  pricePaid?: number;
  trainerName?: string;
  trainerMobile?: string;
  trainerFee?: number;
  trainerNotes?: string;
}): Promise<PlanAssignment> {
  const { data } = await api.post<{ assignment: PlanAssignment }>('/plans/assign', payload);
  return data.assignment;
}