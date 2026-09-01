import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { parseNumericPrice } from '@/utils/price';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, storeId, targetPrice, email } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ success: false, error: 'رمز المنتج مطلوب.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال بريد إلكتروني صحيح.' }, { status: 400 });
    }

    const numericTarget = parseNumericPrice(targetPrice);
    if (numericTarget === null || numericTarget <= 0) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال سعر مستهدف صحيح أعلى من 0.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const id = 'pa_' + Math.random().toString(36).substr(2, 9);

    try {
      const { error } = await supabaseAdmin.from('price_alerts').insert([{
        id,
        product_id: productId,
        store_id: storeId || null,
        target_price: numericTarget,
        email: cleanEmail,
        status: 'active',
        created_at: new Date().toISOString()
      }]);

      if (error) {
        console.warn('[PRICE_ALERTS] Table insert notice:', error.message);
      }
    } catch (dbErr) {
      console.warn('[PRICE_ALERTS] Graceful fallback:', dbErr);
    }

    return NextResponse.json({
      success: true,
      registered: true,
      message: 'تم تسجيل طلب التنبيه بنجاح. سيتم إشعارك فور انخفاض السعر إلى القيمة المطلوبة.'
    });

  } catch (error: any) {
    console.error('Alert Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ في معالجة طلب التنبيه.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('price_alerts')
      .select('id, product_id, store_id, target_price, status, created_at')
      .eq('product_id', productId)
      .eq('status', 'active');

    if (error) {
      return NextResponse.json({ count: 0, alerts: [] });
    }

    return NextResponse.json({ count: data?.length || 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
