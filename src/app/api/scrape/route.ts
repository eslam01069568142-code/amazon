import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { checkAdminAuth } from '@/utils/auth';
import { scrapeAndInsertProduct } from '@/utils/scraper';
import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  try {
    if (!(await checkAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const targetCategory = body.category;
    const isPreview = body.preview === true;
    
    // Support both single url and array of urls for backward compatibility
    const urlList = body.url ? [body.url] : (body.urls || []);
    
    if (!urlList || urlList.length === 0) {
      return NextResponse.json({ error: 'Invalid url provided' }, { status: 400 });
    }

    // Pre-fetch existing categories for matching
    const { data: existingCategories } = await supabaseAdmin
      .from('sections')
      .select('id, title, category, parent_id')
      .eq('type', 'products_by_category');
      
    // Fetch tracking ID
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('tracking_id')
      .limit(1)
      .single();
      
    const trackingId = settingsData?.tracking_id || '';
    if (!trackingId) {
      return NextResponse.json({ error: 'لم يتم العثور على Amazon Tracking ID في الإعدادات. يرجى إضافته أولاً لضمان احتساب العمولات.' }, { status: 400 });
    }

    const results = [];
    let successCount = 0;

    for (const url of urlList) {
      const res = await scrapeAndInsertProduct(url, isPreview, trackingId, existingCategories || [], targetCategory);
      results.push({ url, ...res });
      if (res.success) {
        successCount++;
      }
      
      // If single URL, we return exactly as the old code did
      if (urlList.length === 1) {
        if (!res.success) {
          return NextResponse.json(res, { status: res.status === 'Failed' ? 500 : 200 });
        }
        return NextResponse.json(res);
      }
    }
    
    if (successCount > 0 && !isPreview) {
      revalidateTag('sections', 'max');
    }

    return NextResponse.json({ success: true, results, count: successCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
