import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateRow: Record<string, unknown> = {};
    if (body.productId !== undefined) updateRow.product_id = body.productId;
    if (body.offerPrice !== undefined) updateRow.offer_price = body.offerPrice;
    if (body.startDate !== undefined) updateRow.start_date = body.startDate;
    if (body.endDate !== undefined) updateRow.end_date = body.endDate;
    if (body.enabled !== undefined) updateRow.enabled = body.enabled;
    if (body.order !== undefined) updateRow.order_index = body.order;

    const { data, error } = await supabaseAdmin
      .from('daily_deals')
      .update(updateRow)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Daily deal not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      deal: {
        id: data.id,
        productId: data.product_id,
        offerPrice: data.offer_price,
        startDate: data.start_date,
        endDate: data.end_date,
        enabled: data.enabled,
        order: data.order_index,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update daily deal' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('daily_deals').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete daily deal' }, { status: 500 });
  }
}
