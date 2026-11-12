import { get, patch, post } from '../../lib/api';
import type { Paginated } from '../../lib/types';

export type CreditType = 'VOTING' | 'CHALLENGE';
export type GiftTier = 'ENTRY' | 'STANDARD' | 'MID' | 'ADVANCED' | 'LEGENDARY';
export type GiftKind = 'GIFT' | 'STICKER';
export type CosmeticKind = 'FRAME' | 'THEME' | 'AVATAR';

export const tierLabels: Record<GiftTier, string> = {
  ENTRY: 'Entry',
  STANDARD: 'Standard',
  MID: 'Mid',
  ADVANCED: 'Advanced',
  LEGENDARY: 'Legendary',
};

export type CreditPack = {
  id: string;
  type: CreditType;
  credits: number;
  priceSar: string;
  storeProductId: string;
  isActive: boolean;
  sortOrder: number;
};

export type Gift = {
  id: string;
  slug: string;
  name: string;
  kind: GiftKind;
  tier: GiftTier;
  priceSar: string | null;
  popularityValue: number | null;
  iconUrl: string | null;
  storeProductId: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type Cosmetic = {
  id: string;
  kind: CosmeticKind;
  slug: string;
  name: string;
  isFree: boolean;
  isDefault: boolean;
  priceSar: string | null;
  assetUrl: string | null;
  /** THEME: { appearance, tokens } · FRAME: { glowColor, layout } · AVATAR: null */
  metadata: unknown;
  storeProductId: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { owners: number };
};

export type PurchaseStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PurchaseKind = 'CREDIT_PACK' | 'GIFT' | 'COSMETIC';

export type Purchase = {
  id: string;
  provider: 'APP_STORE' | 'PLAY_STORE' | 'TEST';
  storeProductId: string;
  storeTransactionId: string;
  kind: PurchaseKind;
  quantity: number;
  priceSar: string;
  status: PurchaseStatus;
  createdAt: string;
  user: { id: string; username: string };
};

export const storeKeys = {
  packs: ['store', 'packs'] as const,
  gifts: ['store', 'gifts'] as const,
  cosmetics: ['store', 'cosmetics'] as const,
  purchases: (params: object) => ['store', 'purchases', params] as const,
};

export const storeApi = {
  listPacks: () => get<CreditPack[]>('/admin/store/packs'),
  createPack: (input: Partial<CreditPack>) => post<CreditPack>('/admin/store/packs', input),
  updatePack: (id: string, input: Partial<CreditPack>) => patch<CreditPack>(`/admin/store/packs/${id}`, input),

  listGifts: () => get<Gift[]>('/admin/store/gifts'),
  createGift: (input: Partial<Gift>) => post<Gift>('/admin/store/gifts', input),
  updateGift: (id: string, input: Partial<Gift>) => patch<Gift>(`/admin/store/gifts/${id}`, input),

  listCosmetics: () => get<Cosmetic[]>('/admin/store/cosmetics'),
  createCosmetic: (input: Partial<Omit<Cosmetic, 'priceSar'>> & { priceSar?: string | number | null }) => post<Cosmetic>('/admin/store/cosmetics', input),
  updateCosmetic: (id: string, input: Partial<Omit<Cosmetic, 'priceSar'>> & { priceSar?: string | number | null }) => patch<Cosmetic>(`/admin/store/cosmetics/${id}`, input),

  listPurchases: (params: { page: number; pageSize: number; status?: PurchaseStatus; kind?: PurchaseKind; q?: string }) =>
    get<Paginated<Purchase> & { totalRevenueSar: string }>('/admin/store/purchases', params),
};
