import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { revalidateTag } from 'next/cache';
import { buildAmazonAffiliateUrl } from '@/utils/affiliate';
import { enrichProductData } from '@/services/aiEnricher';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let query = supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  
  const isMyWay = searchParams.get('myway');
  if (isMyWay === 'true') {
    query = query.eq('is_my_way', true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const products = (data || []).map((row: any) => ({
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
    isMyWay: row.is_my_way || false,
    createdAt: row.created_at,
  }));

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // --- Validation Phase ---
    let storeId: string | null = null;
    let trackingId = '';
    const parsePrice = (p: string | null | undefined) => {
      if (!p) return null;
      const num = parseFloat(p.replace(/[^0-9.]/g, ''));
      return (isNaN(num) || num <= 0) ? null : num;
    };
    let parsedPrice: number | null = null;

    if (body.originalUrl) {
      const urlLower = body.originalUrl.toLowerCase();
      if (urlLower.includes('amazon')) storeId = 'store_amazon';
      else if (urlLower.includes('noon')) storeId = 'store_noon';

      if (storeId) {
        parsedPrice = parsePrice(body.price);
        if (parsedPrice === null) {
          return NextResponse.json({ error: 'السعر غير صالح. يرجى إدخال سعر رقمي صحيح.' }, { status: 400 });
        }

        if (storeId === 'store_amazon') {
          const { data: settingsData } = await supabaseAdmin.from('settings').select('tracking_id').limit(1).single();
          trackingId = settingsData?.tracking_id || '';
          if (!trackingId) {
            return NextResponse.json({ error: 'لم يتم العثور على Amazon Tracking ID في الإعدادات.' }, { status: 400 });
          }
        }
      }
    }

    // --- Execution Phase ---
    const id = body.id || ('prod_' + Math.random().toString(36).substr(2, 9));
    const row = {
      id,
      original_url: body.originalUrl,
      title: body.title,
      description: body.description,
      meta_description: body.metaDescription,
      price: body.price,
      original_price: body.originalPrice,
      image: body.image,
      images: body.images || [],
      rating: body.rating,
      category: body.category,
      is_my_way: body.isMyWay || false,
      created_at: body.createdAt || new Date().toISOString(),
    };
    
    if (body.autoEnrich) {
      try {
        const aiData = await enrichProductData(row.title, row.description);
        if (aiData) {
          (row as any).ai_data = aiData;
        }
      } catch (e) {
        console.error('Failed to auto-enrich product:', e);
      }
    }
    
    // Insert Product
    const { data, error } = await supabaseAdmin.from('products').insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Insert Offer if applicable
    if (storeId && parsedPrice !== null) {
      const { data: existingOffer } = await supabaseAdmin
        .from('product_offers')
        .select('id')
        .eq('product_id', data.id)
        .eq('store_id', storeId)
        .single();

      if (!existingOffer) {
        const { error: offerError } = await supabaseAdmin.from('product_offers').insert([{
          id: 'offer_' + Math.random().toString(36).substr(2, 9),
          product_id: data.id,
          store_id: storeId,
          price: parsedPrice,
          original_price: parsePrice(body.originalPrice),
          currency: 'EGP',
          product_url: body.originalUrl,
          affiliate_url: storeId === 'store_amazon' ? buildAmazonAffiliateUrl(body.originalUrl, trackingId) : body.originalUrl,
          availability: 'in_stock',
          created_at: new Date().toISOString()
        }]);
        
        // Manual Rollback if Offer fails
        if (offerError) {
           await supabaseAdmin.from('products').delete().eq('id', data.id);
           return NextResponse.json({ error: 'فشل في حفظ العرض وتم التراجع عن إضافة المنتج: ' + offerError.message }, { status: 500 });
        }
      }
    }

    revalidateTag('products', 'max');
    return NextResponse.json({ success: true, product: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
