import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('sections')
    .select('*')
    .order('order_index', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sections = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    category: row.category,
    productIds: row.product_ids || [],
    enabled: row.enabled,
    order: row.order_index,
    parentId: row.parent_id || null,
    isFeatured: row.is_featured || false,
    icon: row.icon || null,
    image: row.image || null,
  }));
  return NextResponse.json(sections);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Get current max order
    const { data: existing } = await supabaseAdmin
      .from('sections')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

    const row = {
      id: body.id || ('sec_' + Math.random().toString(36).substr(2, 9)),
      title: body.title || 'قسم جديد',
      type: body.type || 'all_products',
      category: body.category || null,
      product_ids: body.productIds || [],
      enabled: body.enabled !== undefined ? body.enabled : true,
      order_index: body.order !== undefined ? body.order : nextOrder,
      parent_id: body.parentId || null,
      is_featured: body.isFeatured || false,
      icon: body.icon || null,
      image: body.image || null,
    };

    const { data, error } = await supabaseAdmin.from('sections').insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
