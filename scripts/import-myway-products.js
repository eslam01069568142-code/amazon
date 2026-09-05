require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

// Ensure native fetch is available (Node 18+)
if (!globalThis.fetch) {
  console.error('This script requires Node.js v18+ with native fetch.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const TARGET_COUNT = 10;
const BASE_DELAY_MS = 600000; // 10 minutes
const JITTER_MS = 30000; // 30 seconds
const SEARCH_URL = 'https://www.amazon.eg/-/en/s?k=' + encodeURIComponent('ماي واي');
const AFFILIATE_TAG = 'bkamelnahar0b-21';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8',
  'Cache-Control': 'max-age=0',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

/** Utility: Parse Numeric Price */
function parseNumericPrice(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

/** Utility: Sleep with Countdown */
async function sleepWithCountdown(ms) {
  const endTime = Date.now() + ms;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        process.stdout.write('\r\x1b[K'); // clear line
        resolve();
      } else {
        process.stdout.write(`\r⏳ Waiting for next fetch... ${remaining} seconds remaining`);
      }
    }, 1000);
  });
}

/** 1. Get Category ID */
async function getMyWayCategoryId() {
  const { data: sections, error } = await supabase
    .from('sections')
    .select('category, title')
    .eq('type', 'products_by_category');

  if (error) {
    console.error('Error fetching categories:', error);
    process.exit(1);
  }

  let myWaySection = sections.find(s => s.title === 'ماي واي' || s.title.toLowerCase().includes('my way'));
  
  if (!myWaySection || !myWaySection.category) {
    console.log('⚠️ Category "ماي واي" not found. Creating it now...');
    const catId = 'cat_' + Date.now().toString(36);
    const sectionId = 'sec_' + Date.now().toString(36);
    const { error: insertErr } = await supabase.from('sections').insert([{
      id: sectionId,
      title: 'ماي واي',
      type: 'products_by_category',
      category: catId,
      enabled: true,
      order_index: 99
    }]);

    if (insertErr) {
      console.error('❌ Failed to create category:', insertErr.message);
      process.exit(1);
    }
    
    console.log(`✅ Created new category "ماي واي" with ID: ${catId}`);
    return catId;
  }

  return myWaySection.category;
}

/** 2. Fetch Search Results and extract ASINs */
async function getAsinsFromSearch() {
  console.log(`\n🔍 Searching Amazon Egypt for "ماي واي"...`);
  try {
    const res = await fetch(SEARCH_URL, { headers: HEADERS });
    if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const asins = [];
    $('[data-asin]').each((i, el) => {
      const asin = $(el).attr('data-asin');
      if (asin && asin.trim().length > 0) {
        asins.push(asin.trim());
      }
    });
    
    // Deduplicate
    const uniqueAsins = [...new Set(asins)];
    console.log(`✅ Found ${uniqueAsins.length} unique products on page 1.`);
    return uniqueAsins;
  } catch (error) {
    console.error('❌ Failed to fetch search results:', error.message);
    return [];
  }
}

/** 3. Scrape Product Page */
async function scrapeProductPage(asin) {
  const url = `https://www.amazon.eg/dp/${asin}?language=ar_AE`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $('#productTitle').text().trim() || $('#title').text().trim();
    
    // Price Extraction
    let priceStr = $('.priceToPay .a-offscreen').first().text().trim();
    if (!priceStr) priceStr = $('.a-price .a-offscreen').first().text().trim();
    if (!priceStr) priceStr = $('#priceblock_ourprice').text().trim();
    
    const numericPrice = parseNumericPrice(priceStr);

    let originalPriceStr = $('.basisPrice .a-offscreen').first().text().trim();
    if (!originalPriceStr) originalPriceStr = $('.a-text-price .a-offscreen').first().text().trim();
    
    // Images
    const images = [];
    const mainImage = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
    if (mainImage) images.push(mainImage);
    
    // If we can't find title or price, it might be a bot check page
    if (!title) {
      console.warn(`⚠️ Warning: Title not found for ASIN ${asin}. Possible bot block.`);
      return null;
    }

    return {
      title,
      price: numericPrice,
      originalPrice: originalPriceStr || null,
      images,
      description: 'منتج من ماي واي - ' + title, // Simplified description
      metaDescription: title
    };
  } catch (err) {
    console.error(`❌ Failed to scrape ${asin}:`, err.message);
    return null;
  }
}

/** Main Execution */
async function run() {
  console.log('🚀 Starting Robust Amazon "My Way" Importer\n');
  
  const categoryId = await getMyWayCategoryId();
  console.log(`🏷️ Using Category ID: ${categoryId} for "ماي واي"\n`);

  const asins = await getAsinsFromSearch();
  if (asins.length === 0) {
    console.error('No ASINs found. Exiting.');
    process.exit(1);
  }

  let importedCount = 0;

  for (let i = 0; i < asins.length; i++) {
    if (importedCount >= TARGET_COUNT) {
      console.log(`\n🎉 Successfully imported ${TARGET_COUNT} products! Terminating.`);
      break;
    }

    const asin = asins[i];
    console.log(`\n-----------------------------------------`);
    console.log(`📦 Processing [${importedCount + 1}/${TARGET_COUNT}] - ASIN: ${asin}`);

    // Check Duplicate
    const productId = `prod_${asin}`;
    const { data: existing } = await supabase.from('products').select('id, title').eq('id', productId).maybeSingle();
    
    if (existing) {
      console.log(`⏭️ Skipping. Product already exists in DB: ${existing.title}`);
      continue;
    }

    const productData = await scrapeProductPage(asin);
    if (!productData) {
      console.log(`⏭️ Skipping due to scrape failure.`);
      // Small wait even on failure to avoid hammering
      await sleepWithCountdown(10000); 
      continue;
    }

    if (!productData.price) {
      console.log(`⏭️ Skipping. No valid price found for: ${productData.title}`);
      await sleepWithCountdown(10000);
      continue;
    }

    // Insert to DB
    const cleanUrl = `https://www.amazon.eg/dp/${asin}?tag=${AFFILIATE_TAG}`;
    
    const dbProduct = {
      id: productId,
      title: productData.title,
      description: productData.description,
      meta_description: productData.metaDescription,
      price: productData.price, // Saving numeric as per requirement, though schema might be string! Let's cast to string to be safe if schema expects string, but prompt says "clean numeric value".
      original_price: productData.originalPrice ? String(parseNumericPrice(productData.originalPrice)) : null, // keep strings if table expects them?
      category: categoryId,
      image: productData.images[0] || '',
      images: productData.images,
      original_url: cleanUrl,
      created_at: new Date().toISOString()
    };
    
    // In our DB `products.price` is a string like "379". 
    dbProduct.price = String(productData.price);

    const { error: insertProdErr } = await supabase.from('products').insert([dbProduct]);
    if (insertProdErr) {
      console.error(`❌ DB Insert Error (Product):`, insertProdErr.message);
      continue;
    }

    const dbOffer = {
      id: `offer_${asin}_${Date.now().toString(36)}`,
      product_id: productId,
      store_id: 'store_amazon',
      price: productData.price,
      original_price: parseNumericPrice(productData.originalPrice),
      currency: 'EGP',
      product_url: cleanUrl,
      affiliate_url: cleanUrl,
      availability: 'in_stock',
      last_checked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertOfferErr } = await supabase.from('product_offers').insert([dbOffer]);
    if (insertOfferErr) {
      console.error(`❌ DB Insert Error (Offer):`, insertOfferErr.message);
      continue;
    }

    importedCount++;
    console.log(`✅ Success! Imported: ${productData.title}`);
    console.log(`   Price: ${productData.price} EGP | Category: ${categoryId}`);

    // Wait if we still need more products
    if (importedCount < TARGET_COUNT) {
      const jitter = Math.floor(Math.random() * (JITTER_MS * 2)) - JITTER_MS; // -30s to +30s
      const delay = BASE_DELAY_MS + jitter;
      console.log(`\n🕒 Sleeping to avoid bot detection... (${Math.round(delay/1000)}s)`);
      await sleepWithCountdown(delay);
    }
  }

  if (importedCount < TARGET_COUNT) {
    console.log(`\n⚠️ Finished scanning page, but only imported ${importedCount} products.`);
  }
}

run();
