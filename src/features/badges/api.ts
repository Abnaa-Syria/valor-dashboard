import { useQuery } from '@tanstack/react-query';
import { del, get, patch, post } from '../../lib/api';

export type BadgeMetric = 'battlesWon' | 'battlesPlayed' | 'gamesPlayed' | 'clipsPublished';

export const metricLabels: Record<BadgeMetric, string> = {
  battlesWon: 'Battles won',
  battlesPlayed: 'Battles played',
  gamesPlayed: 'Games played',
  clipsPublished: 'Clips published',
};

export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  criteria: { metric: BadgeMetric; min: number } | null;
  isCriteriaPending: boolean;
  isActive: boolean;
  sortOrder: number;
  holders: number;
};

export type BadgeDetail = Omit<Badge, 'holders'> & {
  _count: { holders: number };
  holders: { earnedAt: string; awardedById: string | null; user: { id: string; username: string; avatarUrl: string | null } }[];
};

export const badgesKey = ['badges'] as const;

export function useBadges() {
  return useQuery({ queryKey: badgesKey, queryFn: () => get<Badge[]>('/admin/badges') });
}

export const badgesApi = {
  get: (id: string) => get<BadgeDetail>(`/admin/badges/${id}`),
  create: (input: Partial<Badge>) => post<Badge>('/admin/badges', input),
  update: (id: string, input: Partial<Badge>) => patch<Badge>(`/admin/badges/${id}`, input),
  remove: (id: string) => del(`/admin/badges/${id}`),
  award: (userId: string, badgeId: string) => post<{ ok: true }>(`/admin/users/${userId}/badges`, { badgeId }),
  revoke: (userId: string, badgeId: string) => del<{ ok: true }>(`/admin/users/${userId}/badges/${badgeId}`),
};

export function ruleLabel(badge: Pick<Badge, 'criteria' | 'isCriteriaPending'>) {
  if (badge.criteria) return `Automatic: ${metricLabels[badge.criteria.metric]} ≥ ${badge.criteria.min}`;
  return badge.isCriteriaPending ? 'Awarded by admin · rules pending' : 'Awarded by admin';
}
