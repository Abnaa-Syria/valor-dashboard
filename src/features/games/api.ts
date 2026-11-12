import { useQuery } from '@tanstack/react-query';
import { get, patch, post } from '../../lib/api';

export type GameCriteria = { weaponClasses: string[]; ranks: string[] };

export type Game = {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
  criteria: GameCriteria;
  isActive: boolean;
  sortOrder: number;
  counts: { clips: number; battles: number };
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

export function createGame(input: GameInput) {
  return post<Game>('/admin/games', input);
}

export function updateGame(id: string, input: Partial<GameInput>) {
  return patch<Game>(`/admin/games/${id}`, input);
}
