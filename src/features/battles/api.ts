import { get, post } from '../../lib/api';
import type { Paginated } from '../../lib/types';

type PlayerSummary = { id: string; username: string; avatarUrl: string | null };

export type BattleClip = {
  clipId: string;
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  player: PlayerSummary;
};

export type Battle = {
  id: string;
  status: string;
  game: { id: string; slug: string; name: string };
  votingStartsAt: string;
  votingEndsAt: string;
  closedAt: string | null;
  winnerSide: 'A' | 'B' | null;
  votesA: number;
  votesB: number;
  totalVotes: number;
  percentA: number;
  percentB: number;
  clipA: BattleClip;
  clipB: BattleClip;
};

export type BattleDetail = Battle & {
  votes: { side: 'A' | 'B'; createdAt: string; user: { id: string; username: string } }[];
  gifts: {
    id: string;
    battleSide: 'A' | 'B' | null;
    quantity: number;
    popularityAwarded: number;
    awardedAt: string | null;
    createdAt: string;
    gift: { name: string };
    sender: { id: string; username: string };
  }[];
  tickets: { id: string; weaponClass: string; rank: string; createdAt: string; matchedAt: string | null; user: { username: string } }[];
  rematch: { id: string; status: string; battleId: string | null } | null;
  rematchOf: { id: string; originalBattleId: string } | null;
};

export type Entry = {
  id: string;
  status: string;
  weaponClass: string;
  rank: string;
  battleId: string | null;
  createdAt: string;
  matchedAt: string | null;
  expiresAt: string | null;
  user: { id: string; username: string };
  game: { id: string; name: string };
  clip: { id: string; title: string; thumbnailUrl: string | null };
};

export type Rematch = {
  id: string;
  status: string;
  originalBattleId: string;
  battleId: string | null;
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
  challenger: { id: string; username: string };
  opponent: { id: string; username: string };
  originalBattle: { game: { name: string } };
};

/** A clip the admin can put against a waiting entry. */
export type MatchCandidate = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  createdAt: string;
  user: PlayerSummary;
  /** Set when this clip is itself waiting for an opponent. */
  waitingEntry: { id: string; weaponClass: string; rank: string } | null;
};

export const battlesApi = {
  list: (params: object) => get<Paginated<Battle>>('/admin/battles', params),
  get: (id: string) => get<BattleDetail>(`/admin/battles/${id}`),
  cancel: (id: string, reason: string) => post<BattleDetail>(`/admin/battles/${id}/cancel`, { reason }),
  close: (id: string) => post<BattleDetail>(`/admin/battles/${id}/close`),
  extend: (id: string, hours: number) => post<BattleDetail>(`/admin/battles/${id}/extend`, { hours }),
  entries: (params: object) => get<Paginated<Entry>>('/admin/entries', params),
  cancelEntry: (id: string, reason: string) => post(`/admin/entries/${id}/cancel`, { reason }),
  matchCandidates: (id: string, q?: string) => get<MatchCandidate[]>(`/admin/entries/${id}/candidates`, q ? { q } : undefined),
  matchEntry: (id: string, clipId: string) => post<{ battleId: string; matchedWaitingEntry: boolean }>(`/admin/entries/${id}/match`, { clipId }),
  rematches: (params: object) => get<Paginated<Rematch>>('/admin/rematches', params),
  cancelRematch: (id: string, reason: string) => post(`/admin/rematches/${id}/cancel`, { reason }),
};
