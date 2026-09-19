require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DELAY_MS = 60000; // 1 minute
const SEARCH_URL = 'https://www.amazon.eg/-/en/s?k=' + encodeURIComponent('ماي واي');
const AFFILIATE_TAG = 'bkamelnahar0b-21';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8'
};

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
        process.stdout.write(`\r⏳ Waiting for ${remainingSec} seconds before next product... `);
      }
    }, 1000);
  });
}

async function getMyWayCategoryId() {
  const { data: sections } = await supabase.from('sections').select('category, title').eq('type', 'products_by_category');
  let myWaySection = sections.find(s => s.title === 'ماي واي' || s.title.toLowerCase().includes('my way'));
  if (!myWaySection || !myWaySection.category) {
    const catId = 'cat_' + Date.now().toString(36);
    await supabase.from('sections').insert([{ id: 'sec_' + Date.now().toString(36), title: 'ماي واي', type: 'products_by_category', category: catId, enabled: true, order_index: 99 }]);
    return catId;
  }
  return myWaySection.category;
}

async function getAsinsFromSearch() {
  console.log(`\n🔍 Searching Amazon Egypt for "ماي واي"...`);
  let asins = [];
  try {
    for (let page = 1; page <= 3; page++) {
      console.log(`Fetching page ${page}...`);
      const url = `${SEARCH_URL}&page=${page}`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);
      let foundOnPage = 0;
      $('[data-asin]').each((i, el) => {
        const asin = $(el).attr('data-asin');
        if (asin && asin.trim().length > 0) {
          asins.push(asin.trim());
          foundOnPage++;
        }
      });
      if (foundOnPage === 0) break;
      await new Promise(r => setTimeout(r, 2000)); // small delay between search pages
    }
    return [...new Set(asins)];
  } catch (error) {
    console.error('❌ Failed to fetch search results:', error.message);
    return [];
  }
}

async function scrapeProductPage(asin) {
  const url = `https://www.amazon.eg/dp/${asin}?language=ar_AE`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $('#productTitle').text().trim() || $('#title').text().trim();
  if (!title) return null;

  let priceStr = $('.priceToPay .a-offscreen').first().text().trim() || $('.a-price .a-offscreen').first().text().trim() || $('#priceblock_ourprice').text().trim();
  const numericPrice = parseNumericPrice(priceStr);

  let originalPriceStr = $('.basisPrice .a-offscreen').first().text().trim() || $('.a-text-price .a-offscreen').first().text().trim();
  
  const images = [];
  const mainImage = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
  if (mainImage) images.push(mainImage);
  
  return { title, price: numericPrice, originalPrice: originalPriceStr || null, images, description: 'منتج من ماي واي - ' + title, metaDescription: title };
}

async function run() {
  console.log('🚀 Starting Sequential "My Way" Importer (1 product / min)\n');
  const categoryId = await getMyWayCategoryId();
  const asins = await getAsinsFromSearch();
  
  if (asins.length === 0) {
    console.log('No products found.');
    return;
  }
  
  console.log(`✅ Total unique products found: ${asins.length}\n`);

  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];
    const index = i + 1;
    const remaining = asins.length - index;
    const startTime = new Date().toLocaleTimeString('en-GB'); // 24-hour format
    
    console.log(`\n-----------------------------------------`);
    console.log(`🕒 [${startTime}] Processing [${index}/${asins.length}] - ASIN: ${asin}`);
    
    const productId = `prod_${asin}`;
    const { data: existing } = await supabase.from('products').select('id, title').eq('id', productId).maybeSingle();
    
    let didFetchAmazon = false;

    if (existing) {
      console.log(`⏭️  SKIPPED: Product already exists (${existing.title})`);
      skippedCount++;
    } else {
      didFetchAmazon = true;
      try {
        const productData = await scrapeProductPage(asin);
        if (!productData || !productData.price) {
          console.log(`❌ FAILED: Missing title or price data`);
          failedCount++;
        } else {
          const cleanUrl = `https://www.amazon.eg/dp/${asin}?tag=${AFFILIATE_TAG}`;
          const dbProduct = {
            id: productId,
            title: productData.title,
            description: productData.description,
            meta_description: productData.metaDescription,
            price: String(productData.price),
            original_price: productData.originalPrice ? String(parseNumericPrice(productData.originalPrice)) : null,
            category: categoryId,
            image: productData.images[0] || '',
            images: productData.images,
            original_url: cleanUrl,
            is_my_way: true,
            created_at: new Date().toISOString()
          };

          const { error: insertProdErr } = await supabase.from('products').insert([dbProduct]);
          if (insertProdErr) throw new Error(`Product DB Insert: ${insertProdErr.message}`);

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
          if (insertOfferErr) throw new Error(`Offer DB Insert: ${insertOfferErr.message}`);

          console.log(`✅ SUCCESS: Imported -> ${productData.title}`);
          importedCount++;
        }
      } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        failedCount++;
      }
    }

    console.log(`📊 Stats: Imported=${importedCount}, Skipped=${skippedCount}, Failed=${failedCount}, Remaining=${remaining}`);
    
    if (i < asins.length - 1 && didFetchAmazon) {
      await sleepWithCountdown(DELAY_MS);
    }
  }

  console.log(`\n🎉 Import Complete! Total Imported: ${importedCount}`);
}

run();
