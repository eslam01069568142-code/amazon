import { NextResponse } from 'next/server';
import { getDb } from '@/data/db';
import { searchProducts } from '@/lib/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) return NextResponse.json([]);

  const db = await getDb();
  
  const filtered = searchProducts(db.products, q).slice(0, 5); // Limit suggestions to 5

  const suggestions = filtered.map(p => ({ id: p.id, title: p.title }));
  return NextResponse.json(suggestions);
}
