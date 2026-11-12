import { useQuery } from '@tanstack/react-query';
import { del, get, patch, post } from '../../lib/api';

export type GameCriteria = { weaponClasses: string[]; ranks: string[] };

export type Game = {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
  criteria: GameCriteria;
  isActive: boolean;
  sortOrder: number;
  counts: { clips: number; battles: number; tickets?: number };
  createdAt?: string;
  updatedAt?: string;
};

export type GameInput = {
  iconUrl?: string | null;
  name: string;
  slug: string;
  criteria: GameCriteria;
  isActive: boolean;
  sortOrder: number;
};

export const gamesKey = ['games'] as const;

export function useGames() {
  return useQuery({ queryKey: gamesKey, queryFn: () => get<Game[]>('/admin/games'), staleTime: 60_000 });
}

/** Options for game filters on other pages. */
export function useGameOptions() {
  const { data } = useGames();
  return (data ?? []).map((game) => ({ value: game.id, label: game.name }));
}

export const gamesApi = {
  get: (id: string) => get<Game>(`/admin/games/${id}`),
  create: (input: GameInput) => post<Game>('/admin/games', input),
  update: (id: string, input: Partial<GameInput>) => patch<Game>(`/admin/games/${id}`, input),
  remove: (id: string) => del(`/admin/games/${id}`),
};
