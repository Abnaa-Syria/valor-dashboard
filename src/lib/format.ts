import dayjs from 'dayjs';

export function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en-US');
}

export function formatDateTime(value: string | null | undefined) {
  return value ? dayjs(value).format('YYYY/MM/DD HH:mm') : '—';
}
