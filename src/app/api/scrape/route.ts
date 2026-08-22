import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabaseAdmin, Product } from '@/data/db';

export async function POST(req: Request) {
  try {
    const { urls, category } = await req.json();
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Invalid urls array' }, { status: 400 });
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

    for (const url of urls) {
      if (!url.trim()) continue;
      
      try {
        const response = await fetch(url.trim(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch ${url}: ${response.status}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Amazon specific selectors (these can be brittle and may need updates)
        const title = $('#productTitle').text().trim() || 'منتج غير معروف';
        
        let images: string[] = [];
        let mainImage = '';

        // Helper to extract base ID to prevent duplicates
        const getBaseId = (url: string) => {
          const match = url.match(/\/I\/([^._]+)/);
          return match ? match[1] : url;
        };
        const seenIds = new Set<string>();

        // 1. Try colorImages script block (most reliable for gallery)
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
                  if (!seenIds.has(id)) {
                    seenIds.add(id);
                    images.push(hiRes);
                  }
                }
              }
            } catch(e) {}
          }
        }

        // 2. Fallback to altImages thumbnails
        if (images.length === 0) {
          $('#altImages ul li.item img').each((i, el) => {
            let src = $(el).attr('src');
            if (src) {
              src = src.replace(/\._[A-Z0-9_]+\./, '._AC_SL1500_.');
              const id = getBaseId(src);
              if (!seenIds.has(id)) {
                seenIds.add(id);
                images.push(src);
              }
            }
          });
        }

        // 3. Fallback to data-a-dynamic-image
        if (images.length === 0) {
          const dynamicImageStr = $('#landingImage').attr('data-a-dynamic-image') || $('.a-dynamic-image').attr('data-a-dynamic-image');
          if (dynamicImageStr) {
            try {
              const parsedImages = JSON.parse(dynamicImageStr);
              const urls = Object.keys(parsedImages);
              for (const url of urls) {
                const id = getBaseId(url);
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  images.push(url);
                }
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

        // Price (try different selectors)
        let price = $('.a-price .a-offscreen').first().text().trim();
        if (!price) price = $('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen').first().text().trim();
        if (!price) price = 'غير متوفر';

        // Original Price — only use what Amazon actually shows (struck-through price)
        // Do NOT invent or calculate a fake original price
        let originalPrice = $('.a-text-price .a-offscreen').first().text().trim();

        // Rating
        const rating = $('#acrPopover').attr('title') || 'لا يوجد تقييم';

        // Description / Bullet points
        const descriptionArr: string[] = [];
        $('#feature-bullets ul li span.a-list-item').each((i, el) => {
          const text = $(el).text().trim();
          if (text) descriptionArr.push(text);
        });
        const description = descriptionArr.join('\n') || 'لا يوجد وصف متاح.';

        // Automatic Amazon Category Extraction
        let finalCategoryTitle = '';
        const breadcrumbs: string[] = [];
        $('#wayfinding-breadcrumbs_container ul li span.a-list-item a').each((i, el) => {
          const text = $(el).text().trim().replace(/\s+/g, ' ');
          if (text) breadcrumbs.push(text);
        });

        if (breadcrumbs.length > 0) {
          let lastCrumb = breadcrumbs[breadcrumbs.length - 1];
          // If the last breadcrumb is identical to the title or too similar, fallback to the previous one
          if (title.toLowerCase().includes(lastCrumb.toLowerCase()) && breadcrumbs.length > 1) {
            lastCrumb = breadcrumbs[breadcrumbs.length - 2];
          }
          finalCategoryTitle = lastCrumb;
        }

        let assignedCategoryId = '';
        if (finalCategoryTitle) {
          const normalizedTitle = finalCategoryTitle.toLowerCase();
          if (categoryMap.has(normalizedTitle)) {
            assignedCategoryId = categoryMap.get(normalizedTitle)!;
          } else {
            // Create a new store category dynamically
            const newCatId = 'cat_' + Math.random().toString(36).substr(2, 9);
            const { error: catErr } = await supabaseAdmin.from('sections').insert({
              type: 'products_by_category',
              category: newCatId,
              title: finalCategoryTitle,
              enabled: true,
              order_index: 99
            });
            if (!catErr) {
              assignedCategoryId = newCatId;
              categoryMap.set(normalizedTitle, newCatId);
            }
          }
        }

        // Fallback to client-provided category, or empty string (uncategorized)
        if (!assignedCategoryId) {
          assignedCategoryId = category || '';
        }

        const product: Product = {
          id: 'prod_' + Math.random().toString(36).substr(2, 9),
          originalUrl: url.trim(),
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
      } catch (err) {
        console.error(`Error processing ${url}:`, err);
      }
    }

    if (newProducts.length > 0) {
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
      const { error } = await supabaseAdmin.from('products').insert(rows);
      if (error) console.error('Supabase insert error:', error);
    }

    return NextResponse.json({ success: true, count: newProducts.length, products: newProducts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
