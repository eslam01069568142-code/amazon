import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';

export const dynamic = 'force-dynamic';

async function extractAsinFromUrl(url: string, maxRedirects = 5): Promise<string | null> {
  if (maxRedirects <= 0) return null;

  try {
    // Check if the current URL already has an ASIN
    const asinMatch = url.match(/\/(?:dp|product|ASIN)\/([A-Z0-9]{10})(?:\/|\?|$)/i);
    if (asinMatch && asinMatch[1]) {
      return asinMatch[1].toUpperCase();
    }

    // Follow redirect
    const res = await fetch(url, { redirect: 'manual', cache: 'no-store' });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (location) {
        // Handle relative redirects just in case, although rare for Amazon
        const nextUrl = new URL(location, url).toString();
        return await extractAsinFromUrl(nextUrl, maxRedirects - 1);
      }
    }
    
    // If it's 200 OK or no location header, we couldn't find an ASIN
    return null;
  } catch (error) {
    console.error(`[EXCEPTION] Error fetching URL: ${url}`, error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return new NextResponse('Bad Request: Missing product ID', { status: 400 });
  }

  try {
    // Fetch product original URL and tracking ID concurrently
    const [productRes, settingsRes] = await Promise.all([
      supabaseAdmin.from('products').select('original_url').eq('id', id).single(),
      supabaseAdmin.from('settings').select('tracking_id').limit(1).single(),
    ]);

    const product = productRes.data;
    const trackingId = settingsRes.data?.tracking_id;

    if (!product || !product.original_url) {
      return new NextResponse('Product not found', { status: 404 });
    }

    const asin = await extractAsinFromUrl(product.original_url);

    if (asin) {
      // Safely build the clean Amazon URL with the correct tracking ID
      const targetUrl = trackingId 
        ? `https://www.amazon.eg/dp/${asin}?tag=${trackingId}`
        : `https://www.amazon.eg/dp/${asin}`;
      
      return NextResponse.redirect(targetUrl, 302);
    } else {
      // Unsafe fallback prevented: DO NOT redirect to original_url if ASIN is not found.
      console.error(`[EXCEPTION] ASIN not found for Product: ${id} - Original URL: ${product.original_url}`);
      return new NextResponse(`Sorry, the Amazon link for this product could not be verified securely. Product ID: ${id}`, { 
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

  } catch (error) {
    console.error(`[EXCEPTION] Unexpected error in /api/go for Product: ${id}`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
