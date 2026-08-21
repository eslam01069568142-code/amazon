import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { revalidateTag } from 'next/cache';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateRow: Record<string, unknown> = {};
    if (body.title !== undefined) updateRow.title = body.title;
    if (body.category !== undefined) updateRow.category = body.category;
    if (body.originalUrl !== undefined) updateRow.original_url = body.originalUrl;
    if (body.image !== undefined) updateRow.image = body.image;
    if (body.images !== undefined) updateRow.images = body.images;
    if (body.description !== undefined) updateRow.description = body.description;
    if (body.metaDescription !== undefined) updateRow.meta_description = body.metaDescription;
    if (body.price !== undefined) updateRow.price = body.price;
    if (body.originalPrice !== undefined) updateRow.original_price = body.originalPrice;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateRow)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    revalidateTag('products', 'max');
    return NextResponse.json({ success: true, product: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateTag('products', 'max');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
