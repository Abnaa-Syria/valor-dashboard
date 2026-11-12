import { get, patch } from '../../lib/api';
import type { Paginated } from '../../lib/types';

type Owner = { id: string; username: string };

export type ReportTargetDetails =
  | { title: string; status: string; owner: Owner; videoUrl: string | null; thumbnailUrl: string | null }
  | { body: string; status: string; clipId: string; owner: Owner }
  | { username: string; status: string };

export type Report = {
  id: string;
  targetType: 'CLIP' | 'COMMENT' | 'USER';
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  reporter: Owner;
  resolvedBy: { id: string; name: string } | null;
  target: ReportTargetDetails | null;
};

export type ReportDetail = Report & {
  related: (Omit<Report, 'target' | 'resolvedBy'> & { reporter: Owner })[];
};

export const reportsApi = {
  list: (params: object) => get<Paginated<Report>>('/admin/reports', params),
  get: (id: string) => get<ReportDetail>(`/admin/reports/${id}`),
  resolve: (id: string, input: { status: 'RESOLVED' | 'DISMISSED'; note?: string; removeContent?: boolean }) => patch<Report>(`/admin/reports/${id}`, input),
};

/** Where the reported thing lives in the dashboard. */
export function targetLink(report: Pick<Report, 'targetType' | 'targetId' | 'target'>) {
  if (report.targetType === 'CLIP') return `/clips/${report.targetId}`;
  if (report.targetType === 'USER') return `/players/${report.targetId}`;
  const target = report.target as { clipId?: string } | null;
  return target?.clipId ? `/clips/${target.clipId}` : null;
}
