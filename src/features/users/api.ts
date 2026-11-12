import { get, patch, post } from '../../lib/api';
import type { Paginated } from '../../lib/types';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';

export const statusMeta: Record<UserStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'green' },
  SUSPENDED: { label: 'Suspended', color: 'orange' },
  BANNED: { label: 'Banned', color: 'red' },
  DELETED: { label: 'Deleted by player', color: 'default' },
};

export type UserListItem = {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  status: UserStatus;
  popularity: number;
  createdAt: string;
  lastSeenAt: string | null;
};

export type UserDetails = UserListItem & {
  referralCode: string;
  updatedAt: string;
  balances: { type: 'VOTING' | 'CHALLENGE'; freeBalance: number; purchasedBalance: number }[];
  invitedVia: { inviter: { id: string; username: string }; createdAt: string } | null;
  deletedAt: string | null;
  _count: { clips: number; votes: number; referralsMade: number; giftsReceived: number; giftsSent: number; blockedBy: number };
  battles: { total: number; won: number; lost: number; draws: number; winRate: number; votesReceived: number };
  badges: { earnedAt: string; awardedById: string | null; badge: { id: string; name: string; slug: string } }[];
};

export type CreditType = 'VOTING' | 'CHALLENGE';

export type LedgerEntry = {
  id: string;
  type: CreditType;
  source: 'FREE' | 'PURCHASED';
  amount: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  note: string | null;
  createdAt: string;
};

export const ledgerReasonLabels: Record<string, string> = {
  DAILY_ALLOWANCE: 'Daily free credits',
  FREE_EXPIRED: 'Unused free credits expired',
  PURCHASE: 'Purchase',
  VOTE: 'Battle vote',
  BATTLE_ENTRY: 'Battle entry',
  MATCHMAKING_REFUND: 'Battle entry refund',
  ADMIN_ADJUSTMENT: 'Admin adjustment',
};

export function listLedger(id: string, params: { page: number; pageSize: number; type?: CreditType }) {
  return get<Paginated<LedgerEntry>>(`/admin/users/${id}/ledger`, params);
}

export function adjustCredits(id: string, input: { type: CreditType; amount: number; note: string }) {
  return post<unknown>(`/admin/users/${id}/credits`, input);
}

export type ListUsersParams = { page: number; pageSize: number; q?: string; status?: UserStatus };

export const usersKeys = {
  all: ['users'] as const,
  list: (params: ListUsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

export function listUsers(params: ListUsersParams) {
  return get<Paginated<UserListItem>>('/admin/users', params);
}

export function getUser(id: string) {
  return get<UserDetails>(`/admin/users/${id}`);
}

export function updateUserStatus(id: string, status: UserStatus) {
  return patch<UserListItem>(`/admin/users/${id}/status`, { status });
}
