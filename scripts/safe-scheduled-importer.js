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
const MAX_PRODUCTS = 25;
const AFFILIATE_TAG = 'bkamelnahar0b-21';

// Time Configuration
const MIN_DELAY_MS = 15 * 60 * 1000; // 15 minutes
const MAX_DELAY_MS = 22 * 60 * 1000; // 22 minutes
const AUTO_STOP_HOUR = 20; // 8:00 PM

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

const CATEGORIES = [
  { id: 'cat_kitchenapps', queries: ['قلاية هوائية', 'خلاط كهربائي'], name: 'أجهزة المطبخ والمنزل' },
  { id: 'cat_ut73yprlm', queries: ['كريم مرطب', 'غسول وجه'], name: 'العناية بالبشرة والجسم' },
  { id: 'cat_power', queries: ['باور بانك انكر', 'شاحن سريع'], name: 'شواحن وباور بانك' },
  { id: 'cat_u310yd1w3', queries: ['منظم أدوات المنزل'], name: 'تنظيم وتخزين' },
  { id: 'cat_dvuxkdjve', queries: ['حامل موبايل للسيارة'], name: 'مستلزمات السيارات' }
];

function shouldStopDueToTime() {
  const now = new Date();
  if (now.getHours() >= AUTO_STOP_HOUR) {
    return true;
  }
  return false;
}

function parseNumericPrice(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

async function sleepWithCountdown(ms) {
  const endTime = Date.now() + ms;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const remainingSec = Math.round((endTime - Date.now()) / 1000);
      if (remainingSec <= 0) {
        clearInterval(interval);
        process.stdout.write('\r\x1b[K'); 
        resolve();
      } else {
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        process.stdout.write(`\r⏳ Next fetch in: ${mins}m ${secs}s `);
      }
    }, 1000);
  });
}

async function searchAmazon(query) {
  const searchUrl = 'https://www.amazon.eg/-/en/s?k=' + encodeURIComponent(query);
  try {
    const res = await fetch(searchUrl, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const asins = [];
    $('[data-asin]').each((i, el) => {
      const asin = $(el).attr('data-asin');
      if (asin && asin.trim().length > 0) {
        asins.push(asin.trim());
      }
    });
    
    return [...new Set(asins)];
  } catch (error) {
    console.error(`❌ Search failed for "${query}":`, error.message);
    return [];
  }
}

async function scrapeProductPage(asin) {
  const url = `https://www.amazon.eg/dp/${asin}?language=ar_AE`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $('#productTitle').text().trim() || $('#title').text().trim();
    if (!title) return null; // Bot check or invalid page
    
    let priceStr = $('.priceToPay .a-offscreen').first().text().trim() || 
                   $('.a-price .a-offscreen').first().text().trim() || 
                   $('#priceblock_ourprice').text().trim();
    
    const numericPrice = parseNumericPrice(priceStr);
    
    let originalPriceStr = $('.basisPrice .a-offscreen').first().text().trim() || 
                           $('.a-text-price .a-offscreen').first().text().trim();
    
    const images = [];
    const mainImage = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
    if (mainImage) images.push(mainImage);
    
    return {
      title,
      price: numericPrice,
      originalPrice: parseNumericPrice(originalPriceStr),
      images,
      description: title,
      metaDescription: title
    };
  } catch (err) {
    console.error(`❌ Failed to scrape ${asin}:`, err.message);
    return null;
  }
}

async function run() {
  console.log('🚀 Starting Safe Scheduled Amazon Importer (Stealth Mode)');
  console.log(`🎯 Target: 5 Categories | Max Products: ${MAX_PRODUCTS} | Auto-Stop: 8:00 PM\n`);
  
  let importedCount = 0;
  
  // We will loop indefinitely, changing categories in a round-robin fashion, until constraints are met
  let catIndex = 0;
  
  // Keep track of search results for each query to avoid searching repeatedly
  const categoryAsins = {};

  while (importedCount < MAX_PRODUCTS) {
    if (shouldStopDueToTime()) {
      console.log(`\n🛑 Auto-Stop triggered. It is 8:00 PM or later.`);
      break;
    }

    const currentCat = CATEGORIES[catIndex];
    
    console.log(`\n-----------------------------------------`);
    console.log(`🔄 Turn for Category: ${currentCat.name}`);
    
    const query = currentCat.queries[Math.floor(Math.random() * currentCat.queries.length)];
    
    if (!categoryAsins[query] || categoryAsins[query].length === 0) {
      console.log(`🔍 Searching Amazon for: "${query}"`);
      const asins = await searchAmazon(query);
      
      // Shuffle the results for randomness
      for (let i = asins.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [asins[i], asins[j]] = [asins[j], asins[i]];
      }
      
      categoryAsins[query] = asins;
    }

    let success = false;
    
    while (categoryAsins[query].length > 0 && !success) {
      const asin = categoryAsins[query].shift();
      const productId = `prod_${asin}`;
      
      // Check duplicate
      const { data: existing } = await supabase.from('products').select('id, title').eq('id', productId).maybeSingle();
      if (existing) {
        console.log(`⏭️ [Skip] Product exists: ${existing.title}`);
        continue;
      }
      
      console.log(`📦 Attempting to scrape ASIN: ${asin}`);
      const productData = await scrapeProductPage(asin);
      
      if (!productData || !productData.price) {
        console.log(`⏭️ [Skip] Missing data or price for ASIN: ${asin}`);
        // Small penalty delay
        await sleepWithCountdown(10000);
        continue;
      }
      
      const cleanUrl = `https://www.amazon.eg/dp/${asin}?tag=${AFFILIATE_TAG}`;
      
      // Insert Product
      const dbProduct = {
        id: productId,
        title: productData.title,
        description: productData.description,
        meta_description: productData.metaDescription,
        price: String(productData.price),
        original_price: productData.originalPrice ? String(productData.originalPrice) : null,
        category: currentCat.id,
        image: productData.images[0] || '',
        images: productData.images,
        original_url: cleanUrl,
        created_at: new Date().toISOString()
      };
      
      const { error: pErr } = await supabase.from('products').insert([dbProduct]);
      if (pErr) {
        console.error(`❌ DB Insert Error (Product):`, pErr.message);
        continue;
      }
      
      // Insert Offer
      const dbOffer = {
        id: `offer_${asin}_${Date.now().toString(36)}`,
        product_id: productId,
        store_id: 'store_amazon',
        price: productData.price,
        original_price: productData.originalPrice,
        currency: 'EGP',
        product_url: cleanUrl,
        affiliate_url: cleanUrl,
        availability: 'in_stock',
        last_checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: oErr } = await supabase.from('product_offers').insert([dbOffer]);
      if (oErr) {
        console.error(`❌ DB Insert Error (Offer):`, oErr.message);
        continue;
      }
      
      importedCount++;
      success = true;
      console.log(`✅ [${importedCount}/${MAX_PRODUCTS}] Successfully Imported!`);
      console.log(`   └─ ${productData.title.substring(0, 80)}...`);
      console.log(`   └─ Price: ${productData.price} EGP | Category: ${currentCat.name}`);
    }
    
    if (importedCount >= MAX_PRODUCTS || shouldStopDueToTime()) {
      break;
    }
    
    // Cycle to next category
    catIndex = (catIndex + 1) % CATEGORIES.length;
    
    // Random Stealth Delay
    const delayMs = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
    console.log(`\n🕒 Human emulation active. Relaxing before next import...`);
    await sleepWithCountdown(delayMs);
  }

  console.log(`\n🎉 Task Complete! Total imported: ${importedCount}`);
  process.exit(0);
}

run();
