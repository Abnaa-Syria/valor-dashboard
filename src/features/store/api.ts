import { del, get, patch, post } from '../../lib/api';
import type { Paginated } from '../../lib/types';

export type CreditType = 'VOTING' | 'CHALLENGE';
export type GiftTier = 'ENTRY' | 'STANDARD' | 'MID' | 'ADVANCED' | 'LEGENDARY';
export type GiftKind = 'GIFT' | 'STICKER';
export type CosmeticKind = 'FRAME' | 'THEME' | 'AVATAR';

export type CreditPack = {
  id: string;
  type: CreditType;
  credits: number;
  priceSar: string;
  storeProductId: string;
  isActive: boolean;
  sortOrder: number;
  sold?: number;
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
  _count?: { transactions: number };
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

export type CosmeticInput = Partial<Omit<Cosmetic, 'priceSar' | '_count'>> & { priceSar?: string | number | null };

export type Purchase = {
  id: string;
  provider: 'APP_STORE' | 'PLAY_STORE' | 'TEST';
  storeProductId: string;
  storeTransactionId: string;
  kind: string;
  quantity: number;
  priceSar: string;
  status: string;
  createdAt: string;
  user: { id: string; username: string };
};

export type PurchaseDetail = Purchase & {
  refId: string | null;
  updatedAt: string;
  rawPayload: unknown;
  user: { id: string; username: string; email: string };
  gifts: {
    id: string;
    quantity: number;
    popularityAwarded: number;
    awardedAt: string | null;
    battleId: string | null;
    battleSide: string | null;
    gift: { name: string; tier: string };
    recipient: { id: string; username: string };
  }[];
  items: { acquiredAt: string; item: { id: string; name: string; kind: CosmeticKind } }[];
  ledger: { id: string; type: CreditType; source: string; amount: number; reason: string; note: string | null; createdAt: string }[];
};

export const storeApi = {
  listPacks: () => get<CreditPack[]>('/admin/store/packs'),
  getPack: (id: string) => get<CreditPack>(`/admin/store/packs/${id}`),
  createPack: (input: Partial<CreditPack>) => post<CreditPack>('/admin/store/packs', input),
  updatePack: (id: string, input: Partial<CreditPack>) => patch<CreditPack>(`/admin/store/packs/${id}`, input),
  deletePack: (id: string) => del(`/admin/store/packs/${id}`),

  listGifts: () => get<Gift[]>('/admin/store/gifts'),
  getGift: (id: string) => get<Gift>(`/admin/store/gifts/${id}`),
  createGift: (input: Partial<Gift>) => post<Gift>('/admin/store/gifts', input),
  updateGift: (id: string, input: Partial<Gift>) => patch<Gift>(`/admin/store/gifts/${id}`, input),
  deleteGift: (id: string) => del(`/admin/store/gifts/${id}`),

  listCosmetics: () => get<Cosmetic[]>('/admin/store/cosmetics'),
  getCosmetic: (id: string) => get<Cosmetic>(`/admin/store/cosmetics/${id}`),
  createCosmetic: (input: CosmeticInput) => post<Cosmetic>('/admin/store/cosmetics', input),
  updateCosmetic: (id: string, input: CosmeticInput) => patch<Cosmetic>(`/admin/store/cosmetics/${id}`, input),
  deleteCosmetic: (id: string) => del(`/admin/store/cosmetics/${id}`),

  listPurchases: (params: object) => get<Paginated<Purchase> & { totalRevenueSar: string }>('/admin/store/purchases', params),
  getPurchase: (id: string) => get<PurchaseDetail>(`/admin/store/purchases/${id}`),
  refundPurchase: (id: string, reason: string) => post<{ purchase: PurchaseDetail; outcome: string }>(`/admin/store/purchases/${id}/refund`, { reason }),
};

export const storeKeys = {
  packs: ['store', 'packs'] as const,
  gifts: ['store', 'gifts'] as const,
  cosmetics: ['store', 'cosmetics'] as const,
};
