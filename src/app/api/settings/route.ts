import { NextResponse } from 'next/server';
import { supabaseAdmin, settingsToRow } from '@/data/db';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('settings').select('*').limit(1).single();
  if (error) return NextResponse.json({ trackingId: '', socialLinks: [] });

  return NextResponse.json({
    trackingId: data.tracking_id || '',
    facebookPixelId: data.facebook_pixel_id || '',
    socialLinks: data.social_links || [],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Fetch existing first to merge
    const { data: existing } = await supabaseAdmin.from('settings').select('*').limit(1).single();
    const current = existing || { tracking_id: '', facebook_pixel_id: '', social_links: [] };

    const updated = {
      id: 1,
      tracking_id: body.trackingId !== undefined ? body.trackingId : current.tracking_id,
      facebook_pixel_id: body.facebookPixelId !== undefined ? body.facebookPixelId : current.facebook_pixel_id,
      social_links: body.socialLinks !== undefined ? body.socialLinks : current.social_links,
    };

    const { data, error } = await supabaseAdmin.from('settings').upsert(updated).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      settings: {
        trackingId: data.tracking_id,
        facebookPixelId: data.facebook_pixel_id,
        socialLinks: data.social_links || [],
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
