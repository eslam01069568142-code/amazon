import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { buildAmazonAffiliateUrl } from '@/utils/affiliate';
import { buildNoonAffiliateUrl } from '@/utils/noonAffiliate';
import { recordPriceHistory } from '@/utils/priceHistory';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('product_offers')
      .select('*, stores(slug, name)')
      .eq('product_id', productId);
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.productId || !body.storeId) {
      return NextResponse.json({ error: 'Missing productId or storeId' }, { status: 400 });
    }

    if (!body.price) {
      return NextResponse.json({ error: 'السعر مطلوب.' }, { status: 400 });
    }

    const parsePrice = (p: string | number) => {
      if (!p) return null;
      const num = parseFloat(String(p).replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : num;
    };

    const parsedPrice = parsePrice(body.price);
    if (parsedPrice === null) {
      return NextResponse.json({ error: 'السعر غير صالح. يرجى إدخال سعر رقمي صحيح.' }, { status: 400 });
    }

    // Check for duplicate offer
    const { data: existingOffer } = await supabaseAdmin
      .from('product_offers')
      .select('id')
      .eq('product_id', body.productId)
      .eq('store_id', body.storeId)
      .single();

    if (existingOffer) {
      return NextResponse.json({ error: 'هذا المنتج لديه عرض مسجل لهذا المتجر بالفعل.' }, { status: 409 });
    }

    let finalAffiliateUrl = body.affiliateUrl || '';
    if (body.storeId === 'store_amazon') {
      const { data: settingsData } = await supabaseAdmin.from('settings').select('tracking_id').limit(1).single();
      const trackingId = settingsData?.tracking_id || '';
      if (!trackingId) {
        return NextResponse.json({ error: 'لم يتم العثور على Amazon Tracking ID في الإعدادات.' }, { status: 400 });
      }
      finalAffiliateUrl = buildAmazonAffiliateUrl(body.affiliateUrl || body.productUrl || '', trackingId);
    } else if (body.storeId === 'store_noon') {
      const { data: settingsData } = await supabaseAdmin.from('settings').select('social_links').limit(1).single();
      const rawSocial = settingsData?.social_links || [];
      const noonTag = rawSocial.find((s: any) => s.platform === 'noon_tracking_id')?.url || 'AFF72733841fe2f';
      finalAffiliateUrl = buildNoonAffiliateUrl(body.affiliateUrl || body.productUrl || '', noonTag);
    }

    const id = 'offer_' + Math.random().toString(36).substr(2, 9);
    
    const { error } = await supabaseAdmin.from('product_offers').insert([{
      id,
      product_id: body.productId,
      store_id: body.storeId,
      price: parsedPrice,
      original_price: parsePrice(body.originalPrice) || null,
      currency: body.currency || 'EGP',
      product_url: body.productUrl || body.affiliateUrl || '',
      affiliate_url: finalAffiliateUrl,
      availability: body.availability || 'unknown',
    }]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Record initial price history record safely
    await recordPriceHistory(id, body.productId, body.storeId, parsedPrice, body.currency || 'EGP');

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
