import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabaseAdmin } from '@/data/db';
import { getHighResImageUrl } from '@/utils/image';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid URL provided' }, { status: 400 });
    }

    // 1. Fetch the URL and follow redirects
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Failed to fetch: ${response.status}` }, { status: 502 });
    }

    const finalUrl = response.url;
    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. Extract Data
    let title = $('meta[property="og:title"]').attr('content') || '';
    if (!title) title = $('title').text().trim();
    
    // Sometimes title has "- noon Egypt" suffix
    title = title.replace(/\s*-\s*noon( Egypt)?/i, '').trim();

    let mainImage = $('meta[property="og:image"]').attr('content') || '';
    
    let description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    
    let price = '';
    let originalPrice = '';
    
    // Noon uses embedded JSON inside script tags. Let's look for __NEXT_DATA__ or application/ld+json
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const str = $(el).html();
        if (!str) return;
        const ldJson = JSON.parse(str);
        // Sometimes it's an array of objects
        const items = Array.isArray(ldJson) ? ldJson : [ldJson];
        for (const item of items) {
          if (item['@type'] === 'Product' || item['@type'] === 'ItemPage') {
            if (!title && item.name) title = item.name;
            if (!description && item.description) description = item.description;
            if (!mainImage && item.image) {
              mainImage = Array.isArray(item.image) ? item.image[0] : item.image;
            }
            if (item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offers.price) price = offers.price.toString();
            }
          }
        }
      } catch (e) {
        // Ignore parse error for a specific tag
      }
    });

    if (!price) {
      const nextDataStr = $('#__NEXT_DATA__').html();
      if (nextDataStr) {
        try {
          const priceMatch = nextDataStr.match(/"price"\s*:\s*(\d+(\.\d+)?)/);
          if (priceMatch && priceMatch[1]) {
            price = priceMatch[1];
          }
        } catch(e) {}
      }
    }

    // Attempt to extract Noon SKU/ID from URL for duplication check (e.g. noon.com/egypt-ar/.../N12345678A/p)
    let noonSku = '';
    const match = finalUrl.match(/\/([Nn][A-Za-z0-9]+)\/p/);
    if (match && match[1]) {
      noonSku = match[1].toUpperCase();
    }

    let isDuplicate = false;
    let existingProductId = '';
    
    if (noonSku) {
      // Create a predictable product ID for Noon items to prevent duplicates
      const predictedId = `noon_${noonSku}`;
      
      // Check if product exists
      const { data: existingProd } = await supabaseAdmin.from('products').select('id').eq('id', predictedId).single();
      if (existingProd) {
        isDuplicate = true;
        existingProductId = existingProd.id;
      }
    }

    mainImage = getHighResImageUrl(mainImage);
    const cleanedImages = mainImage ? [mainImage] : [];

    return NextResponse.json({
      success: true,
      data: {
        title: title || '',
        description: description || '',
        image: mainImage || '',
        images: cleanedImages,
        price: price || '',
        originalPrice: originalPrice || '',
        originalUrl: finalUrl,
        inputUrl: url,
        predictedId: noonSku ? `noon_${noonSku}` : `prod_${Math.random().toString(36).substr(2, 9)}`,
        isDuplicate,
        existingProductId
      }
    });

  } catch (error: any) {
    console.error('Noon Scrape Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal processing error' }, { status: 500 });
  }
}
