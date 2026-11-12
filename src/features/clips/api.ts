import { get, patch, post } from '../../lib/api';
import type { Paginated } from '../../lib/types';

type PlayerSummary = { id: string; username: string; avatarUrl: string | null };

export type Clip = {
  id: string;
  title: string;
  description: string | null;
  durationSec: number | null;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  game: { id: string; slug: string; name: string };
  owner: PlayerSummary;
  live: { waitingForOpponent: boolean; battleId: string | null };
};

export type ClipDetail = Clip & {
  removedAt: string | null;
  updatedAt: string;
  reportsCount: number;
  likes: { createdAt: string; user: { id: string; username: string } }[];
  battles: {
    id: string;
    status: string;
    side: 'A' | 'B';
    opponent: string;
    result: 'WON' | 'LOST' | 'DRAW' | null;
    votesFor: number;
    votesAgainst: number;
    endsAt: string;
  }[];
};

export type Comment = {
  id: string;
  body: string;
  status: string;
  createdAt: string;
  reportsCount: number;
  user: PlayerSummary;
  clip: { id: string; title: string; thumbnailUrl: string | null };
};

export const clipsApi = {
  list: (params: object) => get<Paginated<Clip>>('/admin/clips', params),
  get: (id: string) => get<ClipDetail>(`/admin/clips/${id}`),
  update: (id: string, input: { title?: string; description?: string | null; gameId?: string }) => patch<ClipDetail>(`/admin/clips/${id}`, input),
  remove: (id: string, reason: string) => post(`/admin/clips/${id}/remove`, { reason }),
  restore: (id: string) => post<ClipDetail>(`/admin/clips/${id}/restore`),
  comments: (params: object) => get<Paginated<Comment>>('/admin/comments', params),
  removeComment: (id: string) => post(`/admin/comments/${id}/remove`),
  restoreComment: (id: string) => post(`/admin/comments/${id}/restore`),
};
