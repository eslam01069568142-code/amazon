import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateRow: Record<string, unknown> = {};
    if (body.title !== undefined) updateRow.title = body.title;
    if (body.type !== undefined) updateRow.type = body.type;
    if (body.category !== undefined) updateRow.category = body.category;
    if (body.productIds !== undefined) updateRow.product_ids = body.productIds;
    if (body.enabled !== undefined) updateRow.enabled = body.enabled;
    if (body.order !== undefined) updateRow.order_index = body.order;
    if (body.parentId !== undefined) updateRow.parent_id = body.parentId;
    if (body.isFeatured !== undefined) updateRow.is_featured = body.isFeatured;
    if (body.icon !== undefined) updateRow.icon = body.icon;
    if (body.image !== undefined) updateRow.image = body.image;

    const { data, error } = await supabaseAdmin
      .from('sections')
      .update(updateRow)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const section = {
      id: data.id,
      title: data.title,
      type: data.type,
      category: data.category,
      productIds: data.product_ids || [],
      enabled: data.enabled,
      order: data.order_index,
      parentId: data.parent_id || null,
      isFeatured: data.is_featured || false,
      icon: data.icon || null,
      image: data.image || null,
    };

    revalidateTag('sections', 'max');
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, section });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('sections').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateTag('sections', 'max');
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
