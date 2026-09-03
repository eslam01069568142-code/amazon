import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { revalidateTag } from 'next/cache';
import { buildAmazonAffiliateUrl } from '@/utils/affiliate';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // 1. Validation Phase
    const parsePrice = (p: string | number) => {
      if (!p || String(p).trim() === '' || p === 'Price unavailable') return null;
      const num = parseFloat(String(p).replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : num;
    };

    let parsedPrice: number | null = null;
    let parsedOriginalPrice: number | null = null;
    
    if (body.price !== undefined) {
      parsedPrice = parsePrice(body.price);
      if (parsedPrice === null) {
        return NextResponse.json({ error: 'السعر غير صالح للتحويل إلى رقم.' }, { status: 400 });
      }
    }
    if (body.originalPrice !== undefined) {
      parsedOriginalPrice = parsePrice(body.originalPrice);
    }

    // 2. Fetch original product for Rollback
    const { data: originalProduct, error: fetchError } = await supabaseAdmin.from('products').select('*').eq('id', id).single();
    if (fetchError || !originalProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 3. Update Product
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
    if (body.isMyWay !== undefined) updateRow.is_my_way = body.isMyWay;

    const { data: updatedProduct, error: updateError } = await supabaseAdmin.from('products').update(updateRow).eq('id', id).select().single();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // 4. Sync Offers
    if (body.price !== undefined || body.originalPrice !== undefined || body.originalUrl !== undefined) {
      const { data: existingOffers, error: offersError } = await supabaseAdmin.from('product_offers').select('*, stores(name)').eq('product_id', id);

      if (offersError) {
        await supabaseAdmin.from('products').update(originalProduct).eq('id', id); // Rollback
        return NextResponse.json({ error: 'فشلت مزامنة العروض وتم التراجع عن تحديث المنتج' }, { status: 500 });
      }

      if (existingOffers && existingOffers.length > 0) {
        let targetOffer = null;
        if (existingOffers.length === 1) {
          targetOffer = existingOffers[0];
        } else {
          const currentUrl = (updatedProduct.original_url || '').toLowerCase();
          if (currentUrl.includes('amazon')) targetOffer = existingOffers.find(o => o.stores?.name?.toLowerCase().includes('amazon'));
          else if (currentUrl.includes('noon')) targetOffer = existingOffers.find(o => o.stores?.name?.toLowerCase().includes('noon'));

          if (!targetOffer) {
            await supabaseAdmin.from('products').update(originalProduct).eq('id', id); // Rollback
            return NextResponse.json({ error: 'تعذر تحديد المتجر لمزامنة العرض وتم التراجع عن تحديث المنتج' }, { status: 400 });
          }
        }

        if (targetOffer) {
          const offerUpdate: Record<string, any> = {};
          
          if (body.originalUrl !== undefined) {
            offerUpdate.product_url = body.originalUrl;
            // Phase 7: Inject Tracking ID for Amazon
            if (targetOffer.stores?.name?.toLowerCase().includes('amazon')) {
              const { data: settingsData } = await supabaseAdmin.from('settings').select('tracking_id').limit(1).single();
              const trackingId = settingsData?.tracking_id || '';
              if (!trackingId) {
                await supabaseAdmin.from('products').update(originalProduct).eq('id', id); // Rollback
                return NextResponse.json({ error: 'لم يتم العثور على Amazon Tracking ID في الإعدادات.' }, { status: 400 });
              }
              offerUpdate.affiliate_url = buildAmazonAffiliateUrl(body.originalUrl, trackingId);
            } else {
              offerUpdate.affiliate_url = body.originalUrl;
            }
          }

          if (parsedPrice !== null) offerUpdate.price = parsedPrice;
          if (body.originalPrice !== undefined) offerUpdate.original_price = parsedOriginalPrice;

          if (Object.keys(offerUpdate).length > 0) {
            const { error: syncError } = await supabaseAdmin.from('product_offers').update(offerUpdate).eq('id', targetOffer.id);
            if (syncError) {
              await supabaseAdmin.from('products').update(originalProduct).eq('id', id); // Rollback
              return NextResponse.json({ error: 'فشل تحديث العرض وتم التراجع عن تحديث المنتج: ' + syncError.message }, { status: 500 });
            }
          }
        }
      }
    }

    revalidateTag('products', 'max');
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Phase 5: Delete related offers first to avoid orphaned data
    const { error: offersError } = await supabaseAdmin
      .from('product_offers')
      .delete()
      .eq('product_id', id);

    if (offersError) {
      return NextResponse.json({ success: false, error: 'Failed to delete product offers: ' + offersError.message }, { status: 500 });
    }

    // Now delete the product itself
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to delete product: ' + error.message }, { status: 500 });
    }
    
    revalidateTag('products', 'max');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
