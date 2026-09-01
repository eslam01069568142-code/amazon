import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { buildAmazonAffiliateUrl } from '@/utils/affiliate';
import { buildNoonAffiliateUrl } from '@/utils/noonAffiliate';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const updateData: any = {};
    if (body.price !== undefined) updateData.price = body.price;
    if (body.originalPrice !== undefined) updateData.original_price = body.originalPrice;
    if (body.productUrl !== undefined) updateData.product_url = body.productUrl;
    if (body.availability !== undefined) updateData.availability = body.availability;

    // Phase 7: Enforce Affiliate Injection
    if (body.affiliateUrl !== undefined || body.productUrl !== undefined) {
      const { data: currentOffer, error: fetchError } = await supabaseAdmin.from('product_offers').select('stores(name)').eq('id', id).single();
      
      if (!fetchError && (currentOffer as any)?.stores?.name?.toLowerCase().includes('amazon')) {
        const rawUrl = body.affiliateUrl !== undefined ? body.affiliateUrl : body.productUrl;
        
        const { data: settingsData } = await supabaseAdmin.from('settings').select('tracking_id').limit(1).single();
        const trackingId = settingsData?.tracking_id || '';
        
        if (!trackingId) {
          return NextResponse.json({ error: 'لم يتم العثور على Amazon Tracking ID في الإعدادات.' }, { status: 400 });
        }
        
        updateData.affiliate_url = buildAmazonAffiliateUrl(rawUrl || '', trackingId);
      } else if (!fetchError && (currentOffer as any)?.stores?.name?.toLowerCase().includes('noon')) {
        const rawUrl = body.affiliateUrl !== undefined ? body.affiliateUrl : body.productUrl;
        const { data: settingsData } = await supabaseAdmin.from('settings').select('social_links').limit(1).single();
        const rawSocial = settingsData?.social_links || [];
        const noonTag = rawSocial.find((s: any) => s.platform === 'noon_tracking_id')?.url || 'AFF72733841fe2f';
        updateData.affiliate_url = buildNoonAffiliateUrl(rawUrl || '', noonTag);
      } else if (body.affiliateUrl !== undefined) {
        updateData.affiliate_url = body.affiliateUrl;
      }
    }

    const { error } = await supabaseAdmin.from('product_offers').update(updateData).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('product_offers').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
