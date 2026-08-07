export type Goal = 'general_fitness' | 'strength' | 'weight_loss' | 'endurance' | 'mobility';
export type PlanType = 'membership' | 'personal_training';
 
export interface User {
  id: string;
  name: string;
  email: string;
  goal: Goal;
  avatarColor: string;
  role: 'owner' | 'admin';
  createdAt: string;
}
 
export interface AuthResponse {
  user: User;
  accessToken: string;
}
 
// ---------------------------------------------------------------------------
// Support Center / Tickets
// ---------------------------------------------------------------------------
export type TicketType = 'support' | 'bug' | 'feature';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';
 
export interface Ticket {
  id: string;
  type: TicketType;
  status: TicketStatus;
  name: string | null;
  gymName: string | null;
  email: string | null;
  subject: string | null;
  message: string;
  adminReply: string | null;
  repliedAt: string | null;
  gymMobile: string | null;
  gymAddress: string | null;
  gymCity: string | null;
  gymState: string | null;
  gymPincode: string | null;
  createdAt: string;
  updatedAt: string;
}
 
export interface CreateTicketInput {
  type: TicketType;
  name?: string;
  gymName?: string;
  email?: string;
  subject?: string;
  message: string;
}
 
export interface ApiErrorPayload {
  message: string;
  errors?: { field: string; message: string }[];
  code?: 'SESSION_REPLACED' | 'SESSION_REVOKED' | string;
}
 
// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export type NotificationType = 'ticket_reply';
 
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  ticketId: string | null;
  isRead: boolean;
  createdAt: string;
}
 
// ---------------------------------------------------------------------------
// Gym
// ---------------------------------------------------------------------------
export interface Gym {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  openingTime: string; // "HH:MM"
  closingTime: string; // "HH:MM"
  logoUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
 
export type GymFormInput = Omit<Gym, 'id' | 'logoUrl' | 'createdAt' | 'updatedAt'>;
 
// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export type MembershipStatus = 'Active' | 'Expired' | 'Paused';
export type Gender = 'Male' | 'Female' | 'Other';
 
export interface Member {
  id: string;
  fullName: string;
  mobile: string;
  email: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyContact: string | null;
  heightCm: number | null;
  weightKg: number | null;
  medicalNotes: string | null;
  joinDate: string;
  membershipStatus: MembershipStatus;
  photoUrl: string | null;
  activePlanName: string | null;
  activePlanEndDate: string | null;
  activePlanFee: number | null;
  createdAt: string;
}
 
export interface MemberFormInput {
  fullName: string;
  mobile: string;
  email?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  heightCm?: number;
  weightKg?: number;
  medicalNotes?: string;
  joinDate?: string;
  membershipStatus?: MembershipStatus;
}
 
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
 
export interface MemberListResponse {
  members: Member[];
  pagination: PaginationMeta;
}
 
export interface MemberFilters {
  search?: string;
  status?: MembershipStatus | '';
  planId?: string;
  joinFrom?: string;
  joinTo?: string;
  sortBy?: 'name' | 'joinDate' | 'fee';
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
 
// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
export type PlanDuration = 1 | 3 | 6 | 12;
 
export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  durationMonths: PlanDuration;
  price: number;
  discount: number;
  finalPrice: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}
 
export interface PlanFormInput {
  name: string;
  description?: string;
  durationMonths: PlanDuration;
  price: number;
  discount?: number;
  features?: string[];
  isActive?: boolean;
}
 
export interface PlanAssignment {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  pricePaid: number;
  status: 'Active' | 'Expired' | 'Cancelled';
}
 
// A row from a member's full plan history (previous + current assignments).
export interface PlanAssignmentHistoryItem {
  id: string;
  planId: string;
  planName: string;
  planType: PlanType;
  startDate: string;
  endDate: string;
  pricePaid: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  createdAt: string;
}
 
// ---------------------------------------------------------------------------
// Dues (paid vs. unpaid members)
// ---------------------------------------------------------------------------
export interface PaidMember {
  id: string;
  fullName: string;
  mobile: string;
  email: string | null;
  photoUrl: string | null;
  planName: string;
  startDate: string;
  endDate: string;
  pricePaid: number;
}
 
export interface UnpaidMember {
  id: string;
  fullName: string;
  mobile: string;
  email: string | null;
  photoUrl: string | null;
  joinDate: string;
  lastPlanName: string | null;
  lastEndDate: string | null;
  lastPricePaid: number | null;
  reason: 'renewal_due' | 'never_subscribed';
}
 
export interface DuesResponse {
  paid: PaidMember[];
  unpaid: UnpaidMember[];
  summary: {
    paidCount: number;
    unpaidCount: number;
    collectedThisPeriod: number;
  };
}
 
// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export interface DashboardSummary {
  totals: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    pausedMembers: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
  newMembersThisMonth: number;
  recentRegistrations: {
    id: string;
    fullName: string;
    joinDate: string;
    membershipStatus: MembershipStatus;
    photoUrl: string | null;
  }[];
  upcomingExpirations: {
    assignmentId: string;
    memberId: string;
    fullName: string;
    mobile: string;
    planName: string;
    endDate: string;
  }[];
  planDistribution: { planId: string; planName: string; memberCount: number }[];
  recentActivity: {
    type: 'member_joined' | 'payment_received';
    refId: string;
    label: string;
    occurredAt: string;
  }[];
  revenueTrend: { month: string; revenue: number }[];
}
 
// ---------------------------------------------------------------------------
// Admin panel
// ---------------------------------------------------------------------------
export interface AdminOverview {
  totalGyms: number;
  owners: { total: number; active: number; inactive: number };
  members: { total: number; active: number };
  revenue: { total: number; thisMonth: number };
}
 
export interface AdminGymSummary {
  gymId: string;
  gymName: string;
  city: string;
  state: string;
  createdAt: string;
  owner: { id: string; name: string; email: string; isActive: boolean };
  memberCount: number;
  activeMemberCount: number;
  revenue: { total: number; thisMonth: number };
}
 
export interface AdminGymDetail {
  gym: {
    id: string;
    name: string;
    city: string;
    state: string;
    mobile: string;
    email: string;
    address: string;
    openingTime: string;
    closingTime: string;
    createdAt: string;
  };
  owner: { id: string; name: string; email: string; isActive: boolean };
  members: {
    id: string;
    fullName: string;
    mobile: string;
    membershipStatus: MembershipStatus;
    joinDate: string;
    activePlanName: string | null;
    activePlanEndDate: string | null;
  }[];
  plans: {
    id: string;
    name: string;
    durationMonths: number;
    finalPrice: number;
    isActive: boolean;
    activeMemberCount: number;
  }[];
  revenue: {
    total: number;
    trend: { month: string; revenue: number }[];
  };
    personalTraining: {
    assignmentId: string;
    memberId: string;
    memberName: string;
    memberMobile: string;
    planName: string;
    trainerName: string | null;
    trainerMobile: string | null;
    trainerFee: number | null;
    startDate: string;
    endDate: string;
    status: 'Active' | 'Expired' | 'Cancelled';
  }[];
}

export interface AdminPersonalTrainingItem {
  assignmentId: string;
  gymId: string;
  gymName: string;
  memberId: string;
  memberName: string;
  memberMobile: string;
  planName: string;
  trainerName: string | null;
  trainerMobile: string | null;
  trainerFee: number | null;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Cancelled';
  createdAt: string;

}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  planType: PlanType;
  durationMonths: PlanDuration;
  price: number;
  discount: number;
  finalPrice: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface PlanFormInput {
  name: string;
  description?: string;
  planType?: PlanType;
  durationMonths: PlanDuration;
  price: number;
  discount?: number;
  features?: string[];
  isActive?: boolean;
}

export interface PlanAssignment {
  id: string;
  memberId: string;
  planId: string;
  planType: PlanType;
  startDate: string;
  endDate: string;
  pricePaid: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  trainerName: string | null;
  trainerMobile: string | null;
  trainerFee: number | null;
  trainerNotes: string | null;
}

export interface PlanAssignmentHistoryItem {
  id: string;
  planId: string;
  planName: string;
  planType: PlanType;
  startDate: string;
  endDate: string;
  pricePaid: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  createdAt: string;
  trainerName: string | null;
  trainerMobile: string | null;
  trainerFee: number | null;
  trainerNotes: string | null;
}