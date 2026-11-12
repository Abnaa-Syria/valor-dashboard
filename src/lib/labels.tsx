import { Tag } from 'antd';

/** Display labels and colors for every status in the system, in one place. */
export type Meta = Record<string, { label: string; color: string }>;

export const playerStatus: Meta = {
  ACTIVE: { label: 'Active', color: 'green' },
  SUSPENDED: { label: 'Suspended', color: 'orange' },
  BANNED: { label: 'Banned', color: 'red' },
  DELETED: { label: 'Deleted by player', color: 'default' },
};

export const clipStatus: Meta = {
  PROCESSING: { label: 'Processing', color: 'blue' },
  READY: { label: 'Published', color: 'green' },
  FAILED: { label: 'Failed', color: 'red' },
  REMOVED: { label: 'Removed', color: 'default' },
};

export const commentStatus: Meta = {
  VISIBLE: { label: 'Visible', color: 'green' },
  REMOVED: { label: 'Removed', color: 'default' },
};

export const battleStatus: Meta = {
  ACTIVE: { label: 'Voting live', color: 'purple' },
  CLOSED: { label: 'Completed', color: 'green' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

export const entryStatus: Meta = {
  QUEUED: { label: 'Waiting', color: 'purple' },
  MATCHED: { label: 'Matched', color: 'green' },
  EXPIRED: { label: 'Expired · refunded', color: 'default' },
  CANCELLED: { label: 'Cancelled · refunded', color: 'default' },
};

export const rematchStatus: Meta = {
  PENDING: { label: 'Waiting for answer', color: 'gold' },
  ACCEPTED: { label: 'Accepted', color: 'green' },
  DECLINED: { label: 'Declined', color: 'default' },
  EXPIRED: { label: 'Expired', color: 'default' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

export const reportStatus: Meta = {
  OPEN: { label: 'Open', color: 'orange' },
  RESOLVED: { label: 'Resolved', color: 'green' },
  DISMISSED: { label: 'Dismissed', color: 'default' },
};

export const reportTarget: Meta = {
  CLIP: { label: 'Clip', color: 'blue' },
  COMMENT: { label: 'Comment', color: 'cyan' },
  USER: { label: 'Player', color: 'magenta' },
};

export const purchaseStatus: Meta = {
  COMPLETED: { label: 'Completed', color: 'green' },
  PENDING: { label: 'Pending', color: 'blue' },
  FAILED: { label: 'Paid, not delivered', color: 'red' },
  REFUNDED: { label: 'Refunded', color: 'default' },
};

export const purchaseKind: Meta = {
  CREDIT_PACK: { label: 'Credit pack', color: 'blue' },
  GIFT: { label: 'Gift', color: 'magenta' },
  COSMETIC: { label: 'Frame / theme / avatar', color: 'purple' },
};

export const providerLabels: Record<string, string> = { APP_STORE: 'App Store', PLAY_STORE: 'Google Play', TEST: 'Test' };

export const ledgerReasons: Record<string, string> = {
  DAILY_ALLOWANCE: 'Daily free credits',
  FREE_EXPIRED: 'Unused free credits expired',
  PURCHASE: 'Purchase',
  VOTE: 'Battle vote',
  BATTLE_ENTRY: 'Battle entry',
  MATCHMAKING_REFUND: 'Refund',
  ADMIN_ADJUSTMENT: 'Admin adjustment',
};

export const giftTiers: Meta = {
  ENTRY: { label: 'Entry', color: 'default' },
  STANDARD: { label: 'Standard', color: 'blue' },
  MID: { label: 'Mid', color: 'cyan' },
  ADVANCED: { label: 'Advanced', color: 'purple' },
  LEGENDARY: { label: 'Legendary', color: 'gold' },
};

export function StatusTag({ meta, value }: { meta: Meta; value: string | null | undefined }) {
  if (!value) return null;
  const entry = meta[value] ?? { label: value, color: 'default' };
  return <Tag color={entry.color}>{entry.label}</Tag>;
}

export const options = (meta: Meta) => Object.entries(meta).map(([value, entry]) => ({ value, label: entry.label }));
