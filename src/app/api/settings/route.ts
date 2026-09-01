import { NextResponse } from 'next/server';
import { supabaseAdmin, settingsToRow } from '@/data/db';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('settings').select('*').limit(1).single();
  if (error) return NextResponse.json({ trackingId: '', noonTrackingId: 'AFF72733841fe2f', facebookPixelId: '', socialLinks: [] });

  const rawSocial = data.social_links || [];
  const noonTagItem = rawSocial.find((s: any) => s.platform === '_noon_affiliate_tag' || s.platform === 'noon_tracking_id');
  const cleanSocial = rawSocial.filter((s: any) => !s.platform.startsWith('_') && s.platform !== 'noon_tracking_id');

  return NextResponse.json({
    trackingId: data.tracking_id || '',
    noonTrackingId: noonTagItem?.url || 'AFF72733841fe2f',
    facebookPixelId: data.facebook_pixel_id || '',
    socialLinks: cleanSocial,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Fetch existing first to merge
    const { data: existing } = await supabaseAdmin.from('settings').select('*').limit(1).single();
    const current = existing || { tracking_id: '', facebook_pixel_id: '', social_links: [] };

    let rawSocial = body.socialLinks !== undefined 
      ? [...body.socialLinks] 
      : (current.social_links || []).filter((s: any) => !s.platform.startsWith('_') && s.platform !== 'noon_tracking_id');

    // Filter out internal tags from incoming user social links
    rawSocial = rawSocial.filter((s: any) => !s.platform.startsWith('_') && s.platform !== 'noon_tracking_id');

    // Store noonTrackingId under private key '_noon_affiliate_tag'
    let noonTag = 'AFF72733841fe2f';
    if (body.noonTrackingId !== undefined) {
      noonTag = String(body.noonTrackingId).trim() || 'AFF72733841fe2f';
    } else {
      const existingNoon = (current.social_links || []).find((s: any) => s.platform === '_noon_affiliate_tag' || s.platform === 'noon_tracking_id');
      if (existingNoon) noonTag = existingNoon.url;
    }

    rawSocial.push({ platform: '_noon_affiliate_tag', url: noonTag });

    const updated = {
      id: 1,
      tracking_id: body.trackingId !== undefined ? body.trackingId : current.tracking_id,
      facebook_pixel_id: body.facebookPixelId !== undefined ? body.facebookPixelId : current.facebook_pixel_id,
      social_links: rawSocial,
    };

    const { data, error } = await supabaseAdmin.from('settings').upsert(updated).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const savedSocial = data.social_links || [];
    const savedNoonTag = savedSocial.find((s: any) => s.platform === '_noon_affiliate_tag' || s.platform === 'noon_tracking_id')?.url || 'AFF72733841fe2f';
    const cleanSavedSocial = savedSocial.filter((s: any) => !s.platform.startsWith('_') && s.platform !== 'noon_tracking_id');

    return NextResponse.json({
      success: true,
      settings: {
        trackingId: data.tracking_id || '',
        noonTrackingId: savedNoonTag,
        facebookPixelId: data.facebook_pixel_id || '',
        socialLinks: cleanSavedSocial,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
