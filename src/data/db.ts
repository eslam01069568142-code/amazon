import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (used in API routes / Server Components) — uses service role for full access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Public client (used for read-only public storefront queries) — uses anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types (preserved exactly from original db.ts) ──────────────────────
export interface Product {
  id: string;
  originalUrl: string;
  title: string;
  description: string;
  metaDescription?: string;
  price: string;
  originalPrice?: string;
  image: string;
  images?: string[];
  rating: string;
  category: string;
  isMyWay?: boolean;
  aiData?: any;
  createdAt: string;
}

export type SectionType =
  | 'category'
  | 'products_by_category'
  | 'category_section'
  | 'all_products'
  | 'featured'
  | 'banner'
  | 'daily_deals'
  | 'new_arrivals'
  | 'best_sellers'
  | 'recommended'
  | 'manual_products';

export interface Section {
  id: string;
  title: string;
  type: SectionType;
  category?: string;
  productIds?: string[];
  enabled: boolean;
  order: number;
  parentId?: string;
  icon?: string;
  image?: string;
  isFeatured?: boolean;
}

export interface DailyDeal {
  id: string;
  productId: string;
  offerPrice?: string;
  startDate?: string;
  endDate?: string;
  enabled: boolean;
  order: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Settings {
  trackingId: string;
  facebookPixelId?: string;
  socialLinks?: SocialLink[];
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  websiteUrl?: string;
  affiliateEnabled: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'unknown';

export interface ProductOffer {
  id: string;
  productId: string;
  storeId: string;
  price?: string;
  originalPrice?: string;
  currency: string;
  productUrl: string;
  affiliateUrl?: string;
  availability: AvailabilityStatus;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbSchema {
  settings: Settings;
  products: Product[];
  sections: Section[];
  dailyDeals: DailyDeal[];
}

// ── Row-to-model converters ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    originalUrl: row.original_url,
    title: row.title,
    description: row.description,
    metaDescription: row.meta_description,
    price: row.price,
    originalPrice: row.original_price,
    image: row.image,
    images: row.images || [],
    rating: row.rating,
    category: row.category,
    aiData: row.ai_data,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSection(row: any): Section {
  return {
    id: row.id,
    title: row.title,
    type: row.type as SectionType,
    category: row.category,
    productIds: row.product_ids || [],
    enabled: row.enabled,
    order: row.order_index,
    parentId: row.parent_id,
    icon: row.icon,
    image: row.image,
    isFeatured: row.is_featured,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDailyDeal(row: any): DailyDeal {
  return {
    id: row.id,
    productId: row.product_id,
    offerPrice: row.offer_price,
    startDate: row.start_date,
    endDate: row.end_date,
    enabled: row.enabled,
    order: row.order_index,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSettings(row: any): Settings {
  return {
    trackingId: row.tracking_id || '',
    facebookPixelId: row.facebook_pixel_id || '',
    socialLinks: row.social_links || [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToStore(row: any): Store {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    websiteUrl: row.website_url,
    affiliateEnabled: row.affiliate_enabled,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToProductOffer(row: any): ProductOffer {
  return {
    id: row.id,
    productId: row.product_id,
    storeId: row.store_id,
    price: row.price,
    originalPrice: row.original_price,
    currency: row.currency,
    productUrl: row.product_url,
    affiliateUrl: row.affiliate_url,
    availability: row.availability as AvailabilityStatus,
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Model-to-row converters ────────────────────────────────────────────

export function productToRow(p: Product) {
  return {
    id: p.id,
    original_url: p.originalUrl,
    title: p.title,
    description: p.description,
    meta_description: p.metaDescription,
    price: p.price,
    original_price: p.originalPrice,
    image: p.image,
    images: p.images || [],
    rating: p.rating,
    category: p.category,
    ai_data: p.aiData,
    created_at: p.createdAt,
  };
}

export function sectionToRow(s: Section) {
  return {
    id: s.id,
    title: s.title,
    type: s.type,
    category: s.category,
    product_ids: s.productIds || [],
    enabled: s.enabled,
    order_index: s.order,
    parent_id: s.parentId,
    icon: s.icon,
    image: s.image,
    is_featured: s.isFeatured,
  };
}

export function dailyDealToRow(d: DailyDeal) {
  return {
    id: d.id,
    product_id: d.productId,
    offer_price: d.offerPrice,
    start_date: d.startDate,
    end_date: d.endDate,
    enabled: d.enabled,
    order_index: d.order,
  };
}

export function settingsToRow(s: Settings) {
  return {
    id: 1,
    tracking_id: s.trackingId,
    facebook_pixel_id: s.facebookPixelId,
    social_links: s.socialLinks || [],
  };
}

export function storeToRow(s: Store) {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    logo: s.logo,
    website_url: s.websiteUrl,
    affiliate_enabled: s.affiliateEnabled,
    enabled: s.enabled,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export function productOfferToRow(po: ProductOffer) {
  return {
    id: po.id,
    product_id: po.productId,
    store_id: po.storeId,
    price: po.price,
    original_price: po.originalPrice,
    currency: po.currency,
    product_url: po.productUrl,
    affiliate_url: po.affiliateUrl,
    availability: po.availability,
    last_checked_at: po.lastCheckedAt,
    created_at: po.createdAt,
    updated_at: po.updatedAt,
  };
}

// ── getDb: read ALL data from Supabase (used by Server Components) ─────
export async function getDb(): Promise<DbSchema> {
  const [productsRes, sectionsRes, dealsRes, settingsRes] = await Promise.all([
    supabaseAdmin.from('products').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('sections').select('*').order('order_index', { ascending: true }),
    supabaseAdmin.from('daily_deals').select('*').order('order_index', { ascending: true }),
    supabaseAdmin.from('settings').select('*').limit(1),
  ]);

  return {
    products: (productsRes.data || []).map(rowToProduct),
    sections: (sectionsRes.data || []).map(rowToSection),
    dailyDeals: (dealsRes.data || []).map(rowToDailyDeal),
    settings: settingsRes.data?.[0]
      ? rowToSettings(settingsRes.data[0])
      : { trackingId: '', socialLinks: [] },
  };
}
