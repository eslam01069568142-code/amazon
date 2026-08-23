import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabaseAdmin, Product } from '@/data/db';
import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetCategory = body.category;
    
    // Support both single url and array of urls for backward compatibility,
    // but the new client will send a single `url` to avoid Vercel timeouts.
    const urlList = body.url ? [body.url] : (body.urls || []);
    
    if (!urlList || urlList.length === 0) {
      return NextResponse.json({ error: 'Invalid url provided' }, { status: 400 });
    }

    // Pre-fetch existing categories for matching
    const { data: existingCategories } = await supabaseAdmin
      .from('sections')
      .select('id, title, category')
      .eq('type', 'products_by_category');
    
    const categoryMap = new Map<string, string>();
    if (existingCategories) {
      for (const cat of existingCategories) {
        if (cat.title) {
          const normalized = cat.title.trim().toLowerCase().replace(/\s+/g, ' ');
          categoryMap.set(normalized, cat.category);
        }
      }
    }

    const newProducts: Product[] = [];
    const results = []; // For returning detailed status

    for (const url of urlList) {
      const cleanUrl = url.trim();
      if (!cleanUrl) continue;
      
      try {
        // Extract ASIN to check for duplicates
        const asinMatch = cleanUrl.match(/(?:dp|o|asin|product|aw\/d)\/([a-zA-Z0-9]{10})/i);
        const asin = asinMatch ? asinMatch[1] : null;
        const productId = asin ? `prod_${asin}` : `prod_${Math.random().toString(36).substr(2, 9)}`;

        if (asin) {
          const { data: existingProd } = await supabaseAdmin.from('products').select('id').eq('id', productId).single();
          if (existingProd) {
            results.push({ url: cleanUrl, success: false, status: 'Duplicate', error: 'Product already exists' });
            // If processing single URL, return immediately
            if (urlList.length === 1) return NextResponse.json({ success: false, status: 'Duplicate', error: 'المنتج موجود بالفعل' });
            continue;
          }
        }

        const response = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });
        
        if (!response.ok) {
          const errorMsg = `Failed to fetch: ${response.status}`;
          results.push({ url: cleanUrl, success: false, status: 'Failed', error: errorMsg });
          if (urlList.length === 1) return NextResponse.json({ success: false, status: 'Failed', error: errorMsg });
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $('#productTitle').text().trim();
        if (!title || title === '') {
          const errorMsg = 'Failed to extract product data (possible CAPTCHA)';
          results.push({ url: cleanUrl, success: false, status: 'Failed', error: errorMsg });
          if (urlList.length === 1) return NextResponse.json({ success: false, status: 'Failed', error: errorMsg });
          continue;
        }
        
        let images: string[] = [];
        let mainImage = '';
        const getBaseId = (imgUrl: string) => {
          const match = imgUrl.match(/\/I\/([^._]+)/);
          return match ? match[1] : imgUrl;
        };
        const seenIds = new Set<string>();

        const scriptContent = $('script').filter((i, el) => $(el).html()?.includes('colorImages') || false).html();
        if (scriptContent) {
          const match = scriptContent.match(/'colorImages':\s*\{'initial':\s*(\[.*?\])\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              for (const img of parsed) {
                const hiRes = img.hiRes || img.large || img.thumb;
                if (hiRes) {
                  const id = getBaseId(hiRes);
                  if (!seenIds.has(id)) { seenIds.add(id); images.push(hiRes); }
                }
              }
            } catch(e) {}
          }
        }

        if (images.length === 0) {
          $('#altImages ul li.item img').each((i, el) => {
            let src = $(el).attr('src');
            if (src) {
              src = src.replace(/\._[A-Z0-9_]+\./, '._AC_SL1500_.');
              const id = getBaseId(src);
              if (!seenIds.has(id)) { seenIds.add(id); images.push(src); }
            }
          });
        }

        if (images.length === 0) {
          const dynamicImageStr = $('#landingImage').attr('data-a-dynamic-image') || $('.a-dynamic-image').attr('data-a-dynamic-image');
          if (dynamicImageStr) {
            try {
              const parsedImages = JSON.parse(dynamicImageStr);
              for (const imgUrl of Object.keys(parsedImages)) {
                const id = getBaseId(imgUrl);
                if (!seenIds.has(id)) { seenIds.add(id); images.push(imgUrl); }
              }
            } catch(e) {}
          }
        }

        if (images.length === 0) {
          mainImage = $('#landingImage').attr('data-old-hires') || $('#landingImage').attr('src') || '';
          if (!mainImage) mainImage = $('.a-dynamic-image').attr('data-old-hires') || $('.a-dynamic-image').attr('src') || '';
          if (mainImage) images.push(mainImage);
        }

        mainImage = images[0] || '';
        if (!mainImage) {
          const errorMsg = 'Failed to extract images';
          results.push({ url: cleanUrl, success: false, status: 'Failed', error: errorMsg });
          if (urlList.length === 1) return NextResponse.json({ success: false, status: 'Failed', error: errorMsg });
          continue;
        }

        let price = $('.a-price .a-offscreen').first().text().trim();
        if (!price) price = $('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen').first().text().trim();
        if (!price) price = 'Price unavailable';

        let originalPrice = $('.a-text-price .a-offscreen').first().text().trim();

        const rating = $('#acrPopover').attr('title') || 'لا يوجد تقييم';
        const reviewsMatch = $('#acrCustomerReviewText').first().text().trim();
        const reviews = reviewsMatch || '';

        const descriptionArr: string[] = [];
        
        const brand = $('#bylineInfo').first().text().trim() || $('#brand').first().text().trim() || '';
        if (brand) {
          descriptionArr.push(`العلامة التجارية: ${brand.replace('Brand: ', '').replace('Visit the ', '')}`);
        }
        
        $('#feature-bullets ul li span.a-list-item').each((i, el) => {
          const text = $(el).text().trim();
          if (text) descriptionArr.push(text);
        });
        
        let description = descriptionArr.join('\n') || 'لا يوجد وصف متاح.';
        if (reviews) description += `\n\nعدد التقييمات: ${reviews}`;

        let finalCategoryTitle = '';
        const breadcrumbs: string[] = [];
        $('#wayfinding-breadcrumbs_container ul li span.a-list-item a, .a-breadcrumb ul li span.a-list-item a').each((i, el) => {
          const text = $(el).text().trim().replace(/\s+/g, ' ');
          if (text) breadcrumbs.push(text);
        });

        if (breadcrumbs.length > 0) {
          const breadcrumbsText = breadcrumbs.join(' ').toLowerCase();
          if (breadcrumbsText.includes('صحة') || breadcrumbsText.includes('جمال') || breadcrumbsText.includes('تجميل') || breadcrumbsText.includes('عناية') || breadcrumbsText.includes('مكياج') || breadcrumbsText.includes('شامبو') || breadcrumbsText.includes('عطر')) {
            finalCategoryTitle = 'الصحة والجمال';
          } else if (breadcrumbsText.includes('الكترونيات') || breadcrumbsText.includes('هاتف') || breadcrumbsText.includes('سماعات') || breadcrumbsText.includes('موبايل') || breadcrumbsText.includes('تلفزيون') || breadcrumbsText.includes('شاشة')) {
            finalCategoryTitle = 'الالكترونيات';
          } else if (breadcrumbsText.includes('لاب') || breadcrumbsText.includes('كمبيوتر') || breadcrumbsText.includes('حاسوب') || breadcrumbsText.includes('اكسسوارات') || breadcrumbsText.includes('ماوس')) {
            finalCategoryTitle = 'لابات\\اكسسورات';
          } else if (breadcrumbsText.includes('منزل') || breadcrumbsText.includes('مطبخ') || breadcrumbsText.includes('تنظيف') || breadcrumbsText.includes('ديكور') || breadcrumbsText.includes('أثاث')) {
            finalCategoryTitle = 'أدوات منزلية';
          } else if (breadcrumbsText.includes('ملابس') || breadcrumbsText.includes('أزياء') || breadcrumbsText.includes('فاشون') || breadcrumbsText.includes('موضة') || breadcrumbsText.includes('حذاء') || breadcrumbsText.includes('ساعة')) {
            finalCategoryTitle = 'فاشون';
          } else {
            finalCategoryTitle = breadcrumbs[0];
          }
        }

        let assignedCategoryId = '';
        if (finalCategoryTitle) {
          const normalizedTitle = finalCategoryTitle.toLowerCase();
          if (categoryMap.has(normalizedTitle)) {
            assignedCategoryId = categoryMap.get(normalizedTitle)!;
          } else {
            const newCatId = 'cat_' + Math.random().toString(36).substr(2, 9);
            const newSectionId = 'sec_' + Math.random().toString(36).substr(2, 9);
            const { error: catErr } = await supabaseAdmin.from('sections').insert({
              id: newSectionId, type: 'products_by_category', category: newCatId, title: finalCategoryTitle, enabled: true, order_index: 99
            });
            if (!catErr) { assignedCategoryId = newCatId; categoryMap.set(normalizedTitle, newCatId); }
          }
        }

        if (!assignedCategoryId) assignedCategoryId = targetCategory || '';
        
        if (!assignedCategoryId) {
          const defaultCategoryTitle = 'عام';
          if (categoryMap.has(defaultCategoryTitle)) {
            assignedCategoryId = categoryMap.get(defaultCategoryTitle)!;
          } else {
            const newCatId = 'cat_' + Math.random().toString(36).substr(2, 9);
            const newSectionId = 'sec_' + Math.random().toString(36).substr(2, 9);
            const { error: catErr } = await supabaseAdmin.from('sections').insert({
              id: newSectionId, type: 'products_by_category', category: newCatId, title: defaultCategoryTitle, enabled: true, order_index: 999
            });
            if (!catErr) { assignedCategoryId = newCatId; categoryMap.set(defaultCategoryTitle, newCatId); }
          }
        }

        const product: Product = {
          id: productId,
          originalUrl: cleanUrl,
          title,
          description,
          price,
          originalPrice,
          image: mainImage,
          images,
          rating,
          category: assignedCategoryId,
          createdAt: new Date().toISOString()
        };

        newProducts.push(product);
        results.push({ url: cleanUrl, success: true, status: 'Success' });
        
        // If single URL, we can insert immediately
        if (urlList.length === 1) {
          const row = {
            id: product.id,
            original_url: product.originalUrl,
            title: product.title,
            description: product.description,
            price: product.price,
            original_price: product.originalPrice,
            image: product.image,
            images: product.images || [],
            rating: product.rating,
            category: product.category,
            created_at: product.createdAt,
          };
          const { error } = await supabaseAdmin.from('products').insert([row]);
          if (error) {
            return NextResponse.json({ success: false, status: 'Failed', error: 'Database insert error' }, { status: 500 });
          }
          revalidateTag('sections', 'max');
          return NextResponse.json({ success: true, status: 'Success', product });
        }

      } catch (err) {
        console.error(`Error processing ${cleanUrl}:`, err);
        results.push({ url: cleanUrl, success: false, status: 'Failed', error: 'Internal processing error' });
        if (urlList.length === 1) return NextResponse.json({ success: false, status: 'Failed', error: 'Internal processing error' }, { status: 500 });
      }
    }

    // Bulk insert fallback if processed array (not recommended due to timeout, but supported)
    if (newProducts.length > 0 && urlList.length > 1) {
      const rows = newProducts.map(p => ({
        id: p.id,
        original_url: p.originalUrl,
        title: p.title,
        description: p.description,
        price: p.price,
        original_price: p.originalPrice,
        image: p.image,
        images: p.images || [],
        rating: p.rating,
        category: p.category,
        created_at: p.createdAt,
      }));
      await supabaseAdmin.from('products').insert(rows);
      revalidateTag('sections', 'max');
    }

    return NextResponse.json({ success: true, results, count: newProducts.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
