import { supabaseAdmin, supabase } from '@/data/db';
import { parseNumericPrice } from '@/utils/price';

export interface PriceHistoryRecord {
  id: string;
  productOfferId: string;
  productId: string;
  storeId: string;
  price: number;
  currency: string;
  recordedAt: string;
}

export interface PriceHistoryTrend {
  lowestPrice: number | null;
  highestPrice: number | null;
  currentPrice: number | null;
  recordCount: number;
  records: PriceHistoryRecord[];
}

/**
 * Safely records a historical price point for a store offer.
 * Prevents duplicate records if the price hasn't changed.
 * Never records null, 0, or invalid prices.
 */
export async function recordPriceHistory(
  productOfferId: string,
  productId: string,
  storeId: string,
  priceInput: string | number | null | undefined,
  currency: string = 'EGP'
): Promise<boolean> {
  const numericPrice = parseNumericPrice(priceInput);
  if (numericPrice === null || numericPrice <= 0) {
    return false; // Never record invalid or 0 price
  }

  try {
    // Check latest recorded price for this offer to prevent consecutive duplicates
    const { data: latestRecord } = await supabaseAdmin
      .from('price_history')
      .select('price')
      .eq('product_offer_id', productOfferId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (latestRecord && Number(latestRecord.price) === numericPrice) {
      return false; // Price unchanged, skip duplicate entry
    }

    const id = 'ph_' + Math.random().toString(36).substr(2, 9);
    const { error } = await supabaseAdmin.from('price_history').insert([{
      id,
      product_offer_id: productOfferId,
      product_id: productId,
      store_id: storeId,
      price: numericPrice,
      currency: currency || 'EGP',
      recorded_at: new Date().toISOString()
    }]);

    return !error;
  } catch (err) {
    // Graceful fallback if table does not exist yet
    console.warn('[PRICE_HISTORY] Notice: price_history insert failed gracefully:', err);
    return false;
  }
}

/**
 * Safely retrieves price history trend for a product/store offer.
 */
export async function getOfferPriceHistory(productId: string, storeId?: string): Promise<PriceHistoryTrend> {
  try {
    let query = supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('recorded_at', { ascending: true });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { lowestPrice: null, highestPrice: null, currentPrice: null, recordCount: 0, records: [] };
    }

    const records: PriceHistoryRecord[] = data.map(r => ({
      id: r.id,
      productOfferId: r.product_offer_id,
      productId: r.product_id,
      storeId: r.store_id,
      price: Number(r.price),
      currency: r.currency || 'EGP',
      recordedAt: r.recorded_at
    })).filter(r => r.price > 0);

    if (records.length === 0) {
      return { lowestPrice: null, highestPrice: null, currentPrice: null, recordCount: 0, records: [] };
    }

    const prices = records.map(r => r.price);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const currentPrice = records[records.length - 1].price;

    return {
      lowestPrice,
      highestPrice,
      currentPrice,
      recordCount: records.length,
      records
    };
  } catch {
    return { lowestPrice: null, highestPrice: null, currentPrice: null, recordCount: 0, records: [] };
  }
}
