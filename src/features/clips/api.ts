import { get, post } from '../../lib/api';
import type { Paginated } from '../../lib/types';

export type ClipStatus = 'PROCESSING' | 'READY' | 'FAILED' | 'REMOVED';

export const clipStatusMeta: Record<ClipStatus, { label: string; color: string }> = {
  PROCESSING: { label: 'Processing', color: 'blue' },
  READY: { label: 'Published', color: 'green' },
  FAILED: { label: 'Failed', color: 'red' },
  REMOVED: { label: 'Removed', color: 'default' },
};

export type Clip = {
  id: string;
  title: string;
  description: string | null;
  durationSec: number | null;
  status: ClipStatus;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  game: { id: string; slug: string; name: string };
  owner: { id: string; username: string; avatarUrl: string | null };
  live: { waitingForOpponent: boolean; battleId: string | null };
};

export type ListClipsParams = { page: number; pageSize: number; q?: string; gameId?: string; status?: ClipStatus };

export const clipsKeys = {
  all: ['clips'] as const,
  list: (params: ListClipsParams) => ['clips', 'list', params] as const,
};

export function listClips(params: ListClipsParams) {
  return get<Paginated<Clip>>('/admin/clips', params);
}

export function removeClip(id: string, reason: string) {
  return post<{ ok: true }>(`/admin/clips/${id}/remove`, { reason });
}
