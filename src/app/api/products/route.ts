import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { revalidateTag } from 'next/cache';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let query = supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
  if (category && category !== 'All') {
    query = query.eq('category', category);
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
    createdAt: row.created_at,
  }));

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      created_at: body.createdAt || new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin.from('products').insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateTag('products', 'max');
    return NextResponse.json({ success: true, product: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
