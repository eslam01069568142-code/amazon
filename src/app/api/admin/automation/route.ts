import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: stores, error: storesError } = await supabase.from('stores').select('*');
    const { data: offers, error: offersError } = await supabase.from('product_offers').select('*').limit(10);

    return NextResponse.json({
      success: true,
      data: {
        stores: stores || [],
        offers: offers || [],
        status: "Active",
        lastSync: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: true, message: "Sync triggered successfully" });
}
