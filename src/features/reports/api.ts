import { get, patch } from '../../lib/api';
import type { Paginated } from '../../lib/types';

export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';
export type ReportTarget = 'CLIP' | 'COMMENT' | 'USER';

export const reportStatusMeta: Record<ReportStatus, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'orange' },
  RESOLVED: { label: 'Resolved', color: 'green' },
  DISMISSED: { label: 'Dismissed', color: 'default' },
};

export const targetLabels: Record<ReportTarget, string> = { CLIP: 'Clip', COMMENT: 'Comment', USER: 'Player' };

type Owner = { id: string; username: string };

export type ReportTargetDetails =
  | { title: string; status: string; owner: Owner; videoUrl: string | null; thumbnailUrl: string | null }
  | { body: string; status: string; clipId: string; owner: Owner }
  | { username: string; status: string };

export type Report = {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  reporter: Owner;
  resolvedBy: { id: string; name: string } | null;
  target: ReportTargetDetails | null;
};

export type ListReportsParams = { page: number; pageSize: number; status?: ReportStatus; targetType?: ReportTarget };

export const reportsKeys = {
  all: ['reports'] as const,
  list: (params: ListReportsParams) => ['reports', 'list', params] as const,
};

export function listReports(params: ListReportsParams) {
  return get<Paginated<Report>>('/admin/reports', params);
}

export function resolveReport(id: string, input: { status: 'RESOLVED' | 'DISMISSED'; note?: string; removeContent?: boolean }) {
  return patch<Report>(`/admin/reports/${id}`, input);
}
