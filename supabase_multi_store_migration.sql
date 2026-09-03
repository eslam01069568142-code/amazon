-- Phase 1: Multi-Store Architecture Migration
-- Run this in your Supabase SQL Editor

-- 1. Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    website_url TEXT,
    affiliate_enabled BOOLEAN DEFAULT true,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create product_offers table
CREATE TABLE IF NOT EXISTS public.product_offers (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    price NUMERIC(12,2),
    original_price NUMERIC(12,2),
    currency TEXT DEFAULT 'EGP',
    product_url TEXT NOT NULL,
    affiliate_url TEXT,
    availability TEXT DEFAULT 'unknown' CHECK (availability IN ('in_stock', 'out_of_stock', 'unknown')),
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(product_id, store_id)
);

-- 3. Create Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_product_offers_product_id ON public.product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_offers_store_id ON public.product_offers(store_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (anon/public: SELECT only - No INSERT/UPDATE/DELETE)
-- Drop existing policies if running multiple times (optional safety)
DROP POLICY IF EXISTS "Allow public read access on stores" ON public.stores;
DROP POLICY IF EXISTS "Allow public read access on product_offers" ON public.product_offers;

CREATE POLICY "Allow public read access on stores" 
ON public.stores FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access on product_offers" 
ON public.product_offers FOR SELECT TO anon USING (true);

-- 6. Insert Idempotent Amazon Store Seed
INSERT INTO public.stores (id, name, slug, website_url, affiliate_enabled, enabled)
VALUES ('store_amazon', 'Amazon', 'amazon', 'https://amazon.eg', true, true)
ON CONFLICT (slug) DO NOTHING;
