import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabaseAdmin } from '@/data/db';
import { getHighResImageUrl } from '@/utils/image';
import { parseNumericPrice } from '@/utils/price';
import { recordPriceHistory } from '@/utils/priceHistory';

export const dynamic = 'force-dynamic';

const CATEGORY_KEYWORDS: { keywords: string[]; categoryId: string }[] = [
  { keywords: ['laptops', 'laptop', 'لابتوب', 'كمبيوتر محمول', 'notebook'], categoryId: 'cat_laptops' },
  { keywords: ['mobile', 'phone', 'smartphone', 'موبايل', 'هاتف', 'سامسونج', 'آيفون', 'شاومي', 'هواتف'], categoryId: 'cat_mobiles' },
  { keywords: ['headphone', 'earbud', 'earphone', 'airpod', 'سماعة', 'سماعات', 'صوتيات'], categoryId: 'cat_audio' },
  { keywords: ['charger', 'cable', 'usb', 'شاحن', 'كابل', 'أسلاك'], categoryId: 'cat_chargers' },
  { keywords: ['power bank', 'باور بانك', 'بنك طاقة'], categoryId: 'cat_powerbanks' },
  { keywords: ['camera', 'كاميرا', 'تصوير', 'عدسة'], categoryId: 'cat_cameras' },
  { keywords: ['watch', 'smartwatch', 'ساعة', 'ساعات ذكية'], categoryId: 'cat_watches' },
  { keywords: ['kitchen', 'cooking', 'مطبخ', 'طبخ', 'أدوات مطبخ', 'قلاية'], categoryId: 'cat_kitchen' },
  { keywords: ['appliance', 'أجهزة منزلية', 'تكييف', 'غسالة', 'ثلاجة', 'مروحة'], categoryId: 'cat_appliances' },
  { keywords: ['decor', 'ديكور', 'مفروشات', 'سجاد'], categoryId: 'cat_decor' },
  { keywords: ['storage', 'تخزين', 'تنظيم'], categoryId: 'cat_storage' },
  { keywords: ['skin', 'skincare', 'بشرة', 'وجه', 'غسول', 'صابون'], categoryId: 'cat_skincare' },
  { keywords: ['hair', 'شعر', 'شامبو', 'بلسم'], categoryId: 'cat_haircare' },
  { keywords: ['perfume', 'fragrance', 'عطر', 'عطور'], categoryId: 'cat_perfumes' },
  { keywords: ['shaver', 'حلاقة', 'عناية شخصية'], categoryId: 'cat_personalcare' },
  { keywords: ['clothing', 'shirt', 'dress', 'ملابس', 'فساتين', 'رجالي', 'حريمي'], categoryId: 'cat_fashion' },
  { keywords: ['shoes', 'أحذية', 'كوتشي'], categoryId: 'cat_shoes' },
  { keywords: ['bag', 'حقائب', 'شنط'], categoryId: 'cat_bags' },
  { keywords: ['gym', 'sports', 'رياضة', 'لياقة', 'معدات رياضية'], categoryId: 'cat_sports' },
  { keywords: ['toy', 'doll', 'ألعاب أطفال', 'دمى'], categoryId: 'cat_toys' },
  { keywords: ['game', 'gaming', 'بلايستيشن', 'ألعاب إلكترونية'], categoryId: 'cat_gaming' },
  { keywords: ['office', 'stationery', 'مكتبية', 'مدرسية', 'قرطاسية'], categoryId: 'cat_office' },
  { keywords: ['car', 'سيارة', 'سيارات', 'إكسسوارات سيارات'], categoryId: 'cat_automotive' }
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  return handleRepair();
}

export async function GET(req: Request) {
  return handleRepair();
}

async function handleRepair() {
  try {
    const logs: string[] = [];
    let categoriesRepaired = 0;
    let imagesRepaired = 0;
    let pricesRepaired = 0;
    let offersRepaired = 0;

    // 1. Load existing categories from DB
    const { data: sections } = await supabaseAdmin
      .from('sections')
      .select('id, category, title, parent_id')
      .eq('type', 'products_by_category');

    const validCategoryIds = new Set((sections || []).map(s => s.category));
    const defaultCategory = sections && sections.length > 0 ? sections[0].category : 'cat_general';

    // 2. Query all products from DB
    const { data: products, error: pErr } = await supabaseAdmin
      .from('products')
      .select('*');

    if (pErr || !products) {
      return NextResponse.json({ success: false, error: 'Failed to fetch products from database' }, { status: 500 });
    }

    logs.push(`Found ${products.length} total products in database.`);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      let updatedFields: Record<string, any> = {};
      let needsDbUpdate = false;

      // ── A. Category Repair ──
      const currentCat = p.category;
      if (!currentCat || currentCat === 'uncategorized' || currentCat.trim() === '' || !validCategoryIds.has(currentCat)) {
        let newCat = '';
        const searchTarget = (p.title + ' ' + (p.description || '')).toLowerCase();

        // Check rule-based keywords first
        for (const rule of CATEGORY_KEYWORDS) {
          if (rule.keywords.some(kw => searchTarget.includes(kw))) {
            const matchedSection = sections?.find(s => s.category === rule.categoryId || s.id === rule.categoryId);
            if (matchedSection) {
              newCat = matchedSection.category;
              break;
            }
          }
        }

        // Check against section titles
        if (!newCat && sections) {
          for (const s of sections) {
            if (s.title && searchTarget.includes(s.title.toLowerCase())) {
              newCat = s.category;
              break;
            }
          }
        }

        // Fallback if still unassigned
        if (!newCat) {
          newCat = defaultCategory;
        }

        updatedFields.category = newCat;
        needsDbUpdate = true;
        categoriesRepaired++;
        logs.push(`[Cat Repair] Product ${p.id}: assigned category '${newCat}'`);
      }

      // ── B. High-Res Image Repair ──
      const currentImage = p.image || '';
      const highResImage = getHighResImageUrl(currentImage);

      if (highResImage && highResImage !== currentImage) {
        updatedFields.image = highResImage;
        needsDbUpdate = true;
        imagesRepaired++;
        logs.push(`[Image Repair] Product ${p.id}: upgraded image to high-res`);
      }

      // Clean images array if present
      if (Array.isArray(p.images) && p.images.length > 0) {
        const cleanedArr = p.images.map((img: string) => getHighResImageUrl(img)).filter(Boolean);
        if (JSON.stringify(cleanedArr) !== JSON.stringify(p.images)) {
          updatedFields.images = cleanedArr;
          needsDbUpdate = true;
        }
      }

      // ── C. Price & Offer Repair ──
      const parsedPrice = parseNumericPrice(p.price);
      const isPriceMissing = parsedPrice === null || parsedPrice <= 0 || p.price === 'Price unavailable';

      // Check product_offers in DB for this product
      const { data: existingOffers } = await supabaseAdmin
        .from('product_offers')
        .select('*')
        .eq('product_id', p.id);

      const hasValidOffer = (existingOffers || []).some(o => parseNumericPrice(o.price) !== null);

      if (isPriceMissing || !hasValidOffer) {
        // If product has original_url, re-scrape to resolve price & high-res media
        if (p.original_url) {
          try {
            await delay(400); // Prevent rate limits

            const isAmazon = p.original_url.includes('amazon');
            const isNoon = p.original_url.includes('noon');

            const res = await fetch(p.original_url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7'
              }
            });

            if (res.ok) {
              const html = await res.text();
              const $ = cheerio.load(html);

              let extractedPrice = '';
              let extractedOrigPrice = '';
              let extractedImg = '';

              if (isAmazon) {
                let priceElem = $('#corePrice_feature_div .a-price .a-offscreen').first().text().trim() ||
                                $('.priceToPay .a-offscreen').first().text().trim() ||
                                $('#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen').first().text().trim() ||
                                $('#corePrice_desktop .priceToPay .a-offscreen').first().text().trim() ||
                                $('#tp_price_block_total_price_ww .a-offscreen').first().text().trim() ||
                                $('#apex_desktop .a-price .a-offscreen').first().text().trim() ||
                                $('span[data-a-color="price"] .a-offscreen').first().text().trim() ||
                                $('.a-price .a-offscreen').first().text().trim() ||
                                $('.a-price-whole').first().text().trim();
                extractedPrice = priceElem;
                extractedOrigPrice = $('.basisPrice .a-offscreen').first().text().trim();
                extractedImg = $('#landingImage').attr('src') || $('.a-dynamic-image').attr('src') || '';
              } else if (isNoon) {
                $('script[type="application/ld+json"]').each((_, el) => {
                  try {
                    const str = $(el).html();
                    if (!str) return;
                    const json = JSON.parse(str);
                    const items = Array.isArray(json) ? json : [json];
                    for (const item of items) {
                      if (item.offers) {
                        const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                        if (offers.price) extractedPrice = String(offers.price);
                      }
                      if (item.image) {
                        extractedImg = Array.isArray(item.image) ? item.image[0] : item.image;
                      }
                    }
                  } catch (e) {}
                });
              }

              const numPrice = parseNumericPrice(extractedPrice);
              if (numPrice !== null && numPrice > 0) {
                updatedFields.price = extractedPrice;
                if (extractedOrigPrice) updatedFields.original_price = extractedOrigPrice;
                needsDbUpdate = true;
                pricesRepaired++;
                logs.push(`[Price Repair] Product ${p.id}: recovered price '${extractedPrice}'`);

                // Insert/Update offer in product_offers
                const isNoonStore = p.id.startsWith('noon_') || p.original_url.includes('noon');
                const { data: storeObj } = await supabaseAdmin.from('stores').select('id').eq('slug', isNoonStore ? 'noon' : 'amazon').single();
                const actualStoreId = storeObj?.id || (isNoonStore ? 'store_noon' : 'store_amazon');

                const numericOrig = parseNumericPrice(extractedOrigPrice);

                const { data: upsertedOffer } = await supabaseAdmin.from('product_offers').upsert({
                  product_id: p.id,
                  store_id: actualStoreId,
                  price: numPrice,
                  original_price: numericOrig || numPrice,
                  currency: 'EGP',
                  product_url: p.original_url,
                  affiliate_url: p.affiliate_link || p.original_url,
                  availability: 'in_stock',
                  updated_at: new Date().toISOString()
                }, { onConflict: 'product_id,store_id' }).select('id').single();

                offersRepaired++;
                if (upsertedOffer?.id) {
                  await recordPriceHistory(upsertedOffer.id, p.id, actualStoreId, numPrice, 'EGP');
                }
              }

              if (extractedImg) {
                const cleanExtracted = getHighResImageUrl(extractedImg);
                if (cleanExtracted && cleanExtracted !== p.image) {
                  updatedFields.image = cleanExtracted;
                  needsDbUpdate = true;
                }
              }
            }
          } catch (err: any) {
            logs.push(`[Re-scrape Error] Product ${p.id}: ${err.message}`);
          }
        }
      }

      // Ensure product_offers record exists if price is present
      if (parsedPrice !== null && parsedPrice > 0 && !hasValidOffer) {
        const isNoon = p.id.startsWith('noon_') || (p.original_url && p.original_url.includes('noon'));
        const { data: storeObj } = await supabaseAdmin.from('stores').select('id').eq('slug', isNoon ? 'noon' : 'amazon').single();
        const storeId = storeObj?.id || (isNoon ? 'store_noon' : 'store_amazon');
        const numOrig = parseNumericPrice(p.original_price);

        await supabaseAdmin.from('product_offers').upsert({
          product_id: p.id,
          store_id: storeId,
          price: parsedPrice,
          original_price: numOrig || parsedPrice,
          currency: 'EGP',
          product_url: p.original_url || 'https://amazon.eg',
          affiliate_url: p.affiliate_link || p.original_url || 'https://amazon.eg',
          availability: 'in_stock',
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id,store_id' });

        offersRepaired++;
        logs.push(`[Offer Repair] Product ${p.id}: created missing product_offers record (${parsedPrice} EGP)`);
      }

      // Apply DB updates to product if needed
      if (needsDbUpdate && Object.keys(updatedFields).length > 0) {
        await supabaseAdmin
          .from('products')
          .update(updatedFields)
          .eq('id', p.id);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalProductsScanned: products.length,
        categoriesRepaired,
        imagesRepaired,
        pricesRepaired,
        offersRepaired
      },
      logs
    });

  } catch (error: any) {
    console.error('Repair Catalog API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
