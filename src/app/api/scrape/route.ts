import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabaseAdmin, Product } from '@/data/db';
import { revalidateTag } from 'next/cache';
import { buildAmazonAffiliateUrl } from '@/utils/affiliate';
import { parseNumericPrice } from '@/utils/price';
import { recordPriceHistory } from '@/utils/priceHistory';
import { getHighResImageUrl } from '@/utils/image';

const ADJECTIVES_TO_IGNORE = [
  'elegant', 'stylish', 'premium', 'beautiful', 'amazing', 'best', 'modern', 'trendy', 'luxury', 
  'أنيق', 'عصري', 'جذاب', 'جميل', 'فاخر', 'رائع', 'ممتاز', 'أفضل', 'حديث', 'new', 'cool', 'popular', 'gift', 'هدية', 'مميز', '2026'
];

const CATEGORY_MAP = [
  // Electronics
  { keywords: ['laptops', 'laptop', 'أجهزة كمبيوتر محمولة', 'كمبيوتر محمول', 'لابتوب', 'لابتوبات', 'notebooks', 'notebook'], child: 'لابتوبات وملحقاتها', parent: 'الإلكترونيات' },
  { keywords: ['mobile phones', 'cell phones', 'smartphones', 'mobile', 'هواتف خلوية', 'هواتف محمولة', 'موبايلات', 'هواتف ذكية'], child: 'الهواتف وملحقاتها', parent: 'الإلكترونيات' },
  { keywords: ['headphones', 'earbuds', 'earphones', 'wireless headphones', 'سماعات', 'سماعات أذن', 'سماعات لاسلكية', 'إيربودز'], child: 'السماعات والصوتيات', parent: 'الإلكترونيات' },
  { keywords: ['chargers', 'charging cables', 'cables', 'usb cables', 'شواحن', 'كابلات', 'أسلاك شحن', 'كابل usb'], child: 'الشواحن والكابلات', parent: 'الإلكترونيات' },
  { keywords: ['power banks', 'portable chargers', 'power bank', 'باور بانك', 'بنك طاقة', 'شاحن محمول'], child: 'الشحن والطاقة المحمولة', parent: 'الإلكترونيات' },
  { keywords: ['cameras', 'digital cameras', 'camera accessories', 'photography', 'cameras & photo', 'كاميرات', 'تصوير', 'إكسسوارات التصوير', 'tripod', 'camera bag', 'عدسات', 'حامل كاميرا'], child: 'الكاميرات والتصوير', parent: 'الإلكترونيات' },
  { keywords: ['smart watches', 'smartwatches', 'wearable technology', 'wearables', 'smartwatch', 'smart watch', 'fitness tracker', 'ساعات ذكية', 'أجهزة ذكية', 'سوار ذكي'], child: 'الساعات والأجهزة الذكية', parent: 'الإلكترونيات' },
  
  // Home & Kitchen
  { keywords: ['kitchen', 'kitchen & dining', 'cooking', 'cookware', 'kitchen tools', 'أدوات مطبخ', 'أدوات المطبخ', 'طبخ', 'أدوات الطبخ', 'أدوات المطبخ والطبخ', 'kitchen utensils'], child: 'أدوات المطبخ والطبخ', parent: 'المنزل والمطبخ' },
  { keywords: ['home appliances', 'appliances', 'أجهزة منزلية', 'أجهزة كهربائية منزلية'], child: 'الأجهزة المنزلية', parent: 'المنزل والمطبخ' },
  { keywords: ['home decor', 'decoration', 'ديكور', 'مفروشات'], child: 'ديكور ومفروشات', parent: 'المنزل والمطبخ' },
  { keywords: ['storage', 'organization', 'home organization', 'storage & organization', 'تنظيم', 'تخزين', 'تنظيم وتخزين'], child: 'تنظيم وتخزين', parent: 'المنزل والمطبخ' },

  // Beauty
  { keywords: ['skincare', 'skin care', 'facial care', 'العناية بالبشرة', 'العناية بالوجه', 'soap', 'صابون', 'body wash', 'غسول'], child: 'العناية بالبشرة والجسم', parent: 'الصحة والجمال' },
  { keywords: ['hair care', 'haircare', 'hair styling', 'hair', 'العناية بالشعر', 'تصفيف الشعر', 'shampoo', 'شامبو', 'conditioner', 'بلسم', 'زيت شعر'], child: 'العناية بالشعر', parent: 'الصحة والجمال' },
  { keywords: ['perfumes', 'fragrance', 'fragrances', 'perfume', 'عطور', 'عطر'], child: 'العطور', parent: 'الصحة والجمال' },
  { keywords: ['personal care devices', 'beauty devices', 'أجهزة العناية الشخصية', 'ماكينة حلاقة', 'shaver', 'hair removal'], child: 'أجهزة العناية الشخصية', parent: 'الصحة والجمال' },

  // Fashion
  { keywords: ["men's clothing", 'men clothing', 'ملابس رجالية'], child: 'ملابس رجالية', parent: 'الأزياء والموضة' },
  { keywords: ["women's clothing", 'women clothing', 'ملابس نسائية', 'فساتين', 'ملابس حريمي', 'dress'], child: 'ملابس نسائية', parent: 'الأزياء والموضة' },
  { keywords: ['shoes', 'footwear', 'أحذية'], child: 'أحذية', parent: 'الأزياء والموضة' },
  { keywords: ['bags', 'handbags', 'backpacks', 'fashion accessories', 'حقائب', 'شنط', 'إكسسوارات'], child: 'حقائب وإكسسوارات', parent: 'الأزياء والموضة' },

  // Sports
  { keywords: ['sports equipment', 'exercise equipment', 'أجهزة رياضية', 'معدات رياضية', 'gym'], child: 'أجهزة رياضية', parent: 'الرياضة واللياقة' },
  { keywords: ['sportswear', 'sports clothing', 'ملابس رياضية'], child: 'ملابس رياضية', parent: 'الرياضة واللياقة' },
  { keywords: ['outdoor', 'camping', 'hiking', 'أنشطة خارجية', 'تخييم'], child: 'مستلزمات الأنشطة الخارجية', parent: 'الرياضة واللياقة' },

  // Toys
  { keywords: ['kids toys', 'dolls', 'ألعاب أطفال', 'دمى'], child: 'ألعاب أطفال ودمى', parent: 'الألعاب والترفيه' },
  { keywords: ['educational toys', 'learning toys', 'ألعاب تعليمية'], child: 'ألعاب تعليمية', parent: 'الألعاب والترفيه' },
  { keywords: ['video games', 'gaming', 'console games', 'ألعاب إلكترونية'], child: 'ألعاب إلكترونية', parent: 'الألعاب والترفيه' },
  { keywords: ['toys', 'ألعاب'], child: 'ألعاب أطفال ودمى', parent: 'الألعاب والترفيه' },

  // Office
  { keywords: ['office products', 'office supplies', 'school supplies', 'stationery', 'أدوات مكتبية', 'أدوات مدرسية', 'قرطاسية'], child: 'أدوات مكتبية ومدرسية', parent: 'المنتجات المكتبية' },
  { keywords: ['printers', 'printer accessories', 'طابعات', 'ملحقات الطابعات'], child: 'طابعات وملحقاتها', parent: 'المنتجات المكتبية' },
  
  // Automotive
  { keywords: ['car accessories', 'إكسسوارات السيارات'], child: 'إكسسوارات السيارات', parent: 'مستلزمات السيارات' },
  { keywords: ['car electronics', 'إلكترونيات السيارات'], child: 'إلكترونيات السيارات', parent: 'مستلزمات السيارات' },
  { keywords: ['car care', 'العناية بالسيارة'], child: 'العناية بالسيارة', parent: 'مستلزمات السيارات' },
  { keywords: ['emergency', 'أدوات ومستلزمات الطوارئ'], child: 'أدوات ومستلزمات الطوارئ', parent: 'مستلزمات السيارات' }
];

function removeAdjectives(text: string): string {
  let cleaned = text.toLowerCase();
  ADJECTIVES_TO_IGNORE.forEach(adj => {
    const regex = new RegExp(`(?<![a-zA-Z\\u0600-\\u06FF])${adj}(?![a-zA-Z\\u0600-\\u06FF])`, 'gi');
    cleaned = cleaned.replace(regex, ' ');
  });
  return cleaned.replace(/\\s+/g, ' ').trim();
}

function findCategory(textList: string[]): { parent: string, child: string } | null {
  for (const text of textList) {
    if (!text) continue;
    const cleaned = removeAdjectives(text);
    for (const mapping of CATEGORY_MAP) {
      if (mapping.keywords.some(kw => cleaned.includes(kw.toLowerCase()))) {
        return { parent: mapping.parent, child: mapping.child };
      }
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetCategory = body.category;
    const isPreview = body.preview === true;
    
    // Support both single url and array of urls for backward compatibility,
    // but the new client will send a single `url` to avoid Vercel timeouts.
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
        // Extract ASIN or Shortlink ID to check for duplicates
        let asin = null;
        const asinMatch = cleanUrl.match(/(?:dp|o|asin|product|aw\/d)\/([a-zA-Z0-9]{10})(?:\/|\?|$)/i);
        if (asinMatch && asinMatch[1]) {
          asin = asinMatch[1].toUpperCase();
        } else {
          const shortMatch = cleanUrl.match(/(?:link\.amazon|amzn\.to|amzlinks\.in)\/([a-zA-Z0-9]+)(?:\/|\?|$)/i);
          if (shortMatch && shortMatch[1]) {
            asin = shortMatch[1];
          }
        }
        const productId = asin ? `prod_${asin}` : `prod_${Math.random().toString(36).substr(2, 9)}`;

        if (asin && !isPreview) {
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

        let title = $('#productTitle').text().trim();
        if (!title) title = $('meta[property="og:title"]').attr('content') || '';
        if (!title) title = $('title').text().replace('Amazon.eg', '').replace(':', '').trim();
        
        if (!title || title === '' || title.includes('Amazon.eg')) {
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

        images = images.map(img => getHighResImageUrl(img)).filter(Boolean);
        mainImage = getHighResImageUrl(images[0] || mainImage);
        if (!mainImage) {
          const errorMsg = 'Failed to extract images';
          results.push({ url: cleanUrl, success: false, status: 'Failed', error: errorMsg });
          if (urlList.length === 1) return NextResponse.json({ success: false, status: 'Failed', error: errorMsg });
          continue;
        }

        let currentPrice = '';
        let originalPrice = '';

        // Priority 1: Primary Amazon price selectors
        let priceElem = $('.priceToPay .a-offscreen').first().text().trim();
        if (!priceElem) priceElem = $('#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen').first().text().trim();
        if (!priceElem) priceElem = $('#corePrice_desktop .priceToPay .a-offscreen').first().text().trim();
        if (!priceElem) priceElem = $('.a-price .a-offscreen').first().text().trim();

        // Priority 2: Structured Data (JSON-LD script tags)
        if (!priceElem) {
          $('script[type="application/ld+json"]').each((_, el) => {
            try {
              const str = $(el).html();
              if (!str) return;
              const json = JSON.parse(str);
              const items = Array.isArray(json) ? json : [json];
              for (const item of items) {
                if (item.offers) {
                  const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                  if (offers.price) {
                    priceElem = String(offers.price);
                    break;
                  }
                }
              }
            } catch (e) {}
          });
        }

        // Priority 3: Fallback Amazon selectors
        if (!priceElem) priceElem = $('#priceblock_ourprice').text().trim();
        if (!priceElem) priceElem = $('#priceblock_dealprice').text().trim();
        if (!priceElem) priceElem = $('.a-price-whole').first().text().trim();
        if (!priceElem) priceElem = $('.a-color-price').first().text().trim();

        currentPrice = priceElem;

        // Extract original list price
        let basisPriceElem = $('.basisPrice .a-offscreen').first().text().trim();
        if (!basisPriceElem) basisPriceElem = $('#corePriceDisplay_desktop_feature_div .basisPrice .a-offscreen').first().text().trim();
        if (!basisPriceElem) basisPriceElem = $('.a-text-price .a-offscreen').first().text().trim();
        
        originalPrice = basisPriceElem;

        // Validate extracted price using parseNumericPrice
        const parsedCurrentNum = parseNumericPrice(currentPrice);
        let needsPrice = false;
        let priceErrorMsg = '';

        if (parsedCurrentNum === null) {
          needsPrice = true;
          priceErrorMsg = 'تعذر استخراج السعر الحالي من Amazon.';
          currentPrice = ''; // Do NOT store '0' or invalid string
        }

        let price = currentPrice;

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

        // --- SMART CATEGORIZATION ENGINE ---
        const breadcrumbs: string[] = [];
        $('#wayfinding-breadcrumbs_container ul li span.a-list-item a, .a-breadcrumb ul li span.a-list-item a').each((i, el) => {
          const text = $(el).text().trim().replace(/\\s+/g, ' ');
          if (text) breadcrumbs.push(text);
        });

        console.log(`[CATEGORY] Breadcrumbs: ${breadcrumbs.join(' > ')}`);
        
        let match = null;
        
        // Priority 1: Breadcrumbs
        if (breadcrumbs.length > 0) {
          match = findCategory(breadcrumbs);
        }
        
        // Priority 2 & 3: Product Title and brand (keywords)
        if (!match) {
          match = findCategory([title, brand]);
        }
        
        let assignedCategoryId = '';
        
        if (match) {
          const matchedChild = existingCategories?.find(c => c.title === match?.child);
          if (matchedChild && matchedChild.category) {
            assignedCategoryId = matchedChild.category;
            console.log(`[CATEGORY] Mapped: ${match.parent} -> ${match.child}`);
          }
        }
        
        let needsCategory = false;
        let categoryErrorMsg = '';
        if (!assignedCategoryId) {
          needsCategory = true;
          categoryErrorMsg = 'تعذر تحديد الفئة تلقائياً.';
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

        if (needsPrice || needsCategory) {
          const combinedErrors = [priceErrorMsg, categoryErrorMsg].filter(Boolean).join(' | ');
          results.push({ url: cleanUrl, success: false, status: 'NeedsInput', error: combinedErrors, product, needsPrice, needsCategory } as any);
          if (urlList.length === 1) return NextResponse.json({ success: false, status: 'NeedsInput', error: combinedErrors, product, needsPrice, needsCategory });
          continue;
        }

        newProducts.push(product);
        results.push({ url: cleanUrl, success: true, status: 'Success' });
        
        // If single URL, we can insert immediately
        if (urlList.length === 1) {
          if (isPreview) {
            return NextResponse.json({ success: true, status: 'Preview', product });
          }
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

          // Insert Amazon Offer
          const offerPriceNum = parseNumericPrice(product.price);
          const offerOrigPriceNum = parseNumericPrice(product.originalPrice);
          const offerId = 'offer_' + Math.random().toString(36).substr(2, 9);
          
          await supabaseAdmin.from('product_offers').insert([{
            id: offerId,
            product_id: product.id,
            store_id: 'store_amazon',
            price: offerPriceNum,
            original_price: offerOrigPriceNum,
            currency: 'EGP',
            product_url: product.originalUrl,
            affiliate_url: buildAmazonAffiliateUrl(product.originalUrl, trackingId),
            availability: 'in_stock',
            created_at: new Date().toISOString()
          }]);

          if (offerPriceNum) {
            await recordPriceHistory(offerId, product.id, 'store_amazon', offerPriceNum, 'EGP');
          }

          // Revalidate the cache so new categories appear immediately in the Header
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

      const offerRows = newProducts.map(p => ({
        id: 'offer_' + Math.random().toString(36).substr(2, 9),
        product_id: p.id,
        store_id: 'store_amazon',
        price: parseNumericPrice(p.price),
        original_price: parseNumericPrice(p.originalPrice),
        currency: 'EGP',
        product_url: p.originalUrl,
        affiliate_url: buildAmazonAffiliateUrl(p.originalUrl, trackingId),
        availability: 'in_stock',
        created_at: new Date().toISOString()
      }));
      await supabaseAdmin.from('product_offers').insert(offerRows);

      revalidateTag('sections', 'max');
    }

    return NextResponse.json({ success: true, results, count: newProducts.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
