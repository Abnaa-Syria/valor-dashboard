import { get, post } from '../../lib/api';
import type { Paginated } from '../../lib/types';

export type BattleStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';
export type BattleSide = 'A' | 'B';

export const battleStatusMeta: Record<BattleStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Voting live', color: 'purple' },
  CLOSED: { label: 'Completed', color: 'green' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

export type BattleClip = {
  clipId: string;
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  player: { id: string; username: string; avatarUrl: string | null };
};

export type Battle = {
  id: string;
  status: BattleStatus;
  game: { id: string; slug: string; name: string };
  votingStartsAt: string;
  votingEndsAt: string;
  closedAt: string | null;
  winnerSide: BattleSide | null;
  votesA: number;
  votesB: number;
  totalVotes: number;
  percentA: number;
  percentB: number;
  clipA: BattleClip;
  clipB: BattleClip;
};

export type ListBattlesParams = { page: number; pageSize: number; gameId?: string; status?: BattleStatus };

export const battlesKeys = {
  all: ['battles'] as const,
  list: (params: ListBattlesParams) => ['battles', 'list', params] as const,
};

export function listBattles(params: ListBattlesParams) {
  return get<Paginated<Battle>>('/admin/battles', params);
}

export function cancelBattle(id: string, reason: string) {
  return post<Battle>(`/admin/battles/${id}/cancel`, { reason });
}
