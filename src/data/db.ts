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
