import { get } from '../../lib/api';
import type { Paginated } from '../../lib/types';

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  details: unknown;
  createdAt: string;
  admin: { id: string; name: string; email: string };
};

export const auditApi = {
  list: (params: object) => get<Paginated<AuditEntry>>('/admin/audit', params),
  entityTypes: () => get<string[]>('/admin/audit/entity-types'),
};

/** Dashboard page for an audited entity, when there is one. */
export function entityPath(entityType: string, entityId: string | null) {
  if (!entityId) return entityType === 'settings' ? '/settings' : null;
  const map: Record<string, string> = {
    player: '/players',
    clip: '/clips',
    battle: '/battles',
    report: '/reports',
    purchase: '/purchases',
    pack: '/store/packs',
    gift: '/store/gifts',
    frame: '/customization/frames',
    theme: '/customization/themes',
    avatar: '/customization/avatars',
    game: '/games',
    badge: '/badges',
    admin: '/admins',
  };
  const base = map[entityType];
  return base ? `${base}/${entityId}` : null;
}
