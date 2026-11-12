export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

export type Admin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastLoginAt: string | null;
};

export type Paginated<T> = {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export const roleLabels: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
};
