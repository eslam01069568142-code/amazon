import { NextResponse } from 'next/server';
import { supabaseAdmin, DailyDeal } from '@/data/db';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('daily_deals')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const deals = (data || []).map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      offerPrice: row.offer_price,
      startDate: row.start_date,
      endDate: row.end_date,
      enabled: row.enabled,
      order: row.order_index,
    }));
    return NextResponse.json(deals);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch daily deals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { count } = await supabaseAdmin.from('daily_deals').select('*', { count: 'exact', head: true });

    const row = {
      id: body.id || crypto.randomUUID(),
      product_id: body.productId,
      offer_price: body.offerPrice,
      start_date: body.startDate,
      end_date: body.endDate,
      enabled: body.enabled !== undefined ? body.enabled : true,
      order_index: body.order !== undefined ? body.order : (count || 0),
    };

    const { data, error } = await supabaseAdmin.from('daily_deals').insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      id: data.id,
      productId: data.product_id,
      offerPrice: data.offer_price,
      startDate: data.start_date,
      endDate: data.end_date,
      enabled: data.enabled,
      order: data.order_index,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create daily deal' }, { status: 500 });
  }
}
