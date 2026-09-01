import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('stores').select('*').order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
