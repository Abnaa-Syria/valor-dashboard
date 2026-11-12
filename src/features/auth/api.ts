import { useQuery } from '@tanstack/react-query';
import { get, post } from '../../lib/api';
import { getToken } from '../../lib/auth-storage';
import type { Admin } from '../../lib/types';

export const meQueryKey = ['auth', 'me'] as const;

export function login(email: string, password: string) {
  return post<{ token: string; admin: Admin }>('/admin/auth/login', { email, password });
}

export function useCurrentAdmin() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => get<Admin>('/admin/auth/me'),
    enabled: Boolean(getToken()),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
