require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
const axios = require('axios');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Map common subcategories to realistic Amazon Arabic searches
const SEARCH_MAP = {
  'شواحن وباور بانك': 'شاحن باور بانك',
  'كاميرات مراقبة': 'كاميرا مراقبة',
  'موبايلات': 'موبايل سامسونج',
  'أدوات المطبخ والطبخ': 'طقم حلل',
  'الأجهزة المنزلية': 'خلاط كهربائي',
  'ملابس رجالية': 'تيشيرت رجالي',
  'ملابس نسائية': 'بلوزة حريمي',
  'شنط سفر وكروس': 'شنطة ظهر سفر',
  'العطور': 'عطر رجالي ونسائي',
  'مستلزمات السيارات': 'حامل موبايل للسيارة',
  'الرياضة واللياقة': 'دمبل رياضية',
  'المنتجات المكتبية': 'منظم مكتب',
  'العناية الشخصية': 'ماكينة حلاقة',
  'الكمبيوتر': 'لابتوب',
  'ماي واي': 'شامبو ماي واي'
};

function generateId() {
  return 'prod_' + crypto.randomBytes(8).toString('hex');
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  const num = priceStr.replace(/[^\d.]/g, '');
  if (!num) return null;
  return parseFloat(num);
}

function extractASIN(url) {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return match ? match[1] : null;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay() {
  // 8 to 15 minutes in ms
  const min = 8 * 60 * 1000;
  const max = 15 * 60 * 1000;
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function scrapeAmazonSearch(query) {
  try {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const searchUrl = `https://www.amazon.eg/s?k=${encodeURIComponent(query)}&language=ar_AE&s=exact-aware-popularity-rank`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'Accept-Language': 'ar-EG,ar;q=0.9',
        'Cookie': 'lc-acbeg=ar_AE; i18n-prefs=EGP;',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const products = [];
    
    const items = $('.s-result-item[data-component-type="s-search-result"]');
    if (items.length === 0) {
      console.log(`[Debug] No search results found for "${query}". HTML length: ${response.data.length}`);
    }

    items.each((i, el) => {
      if (products.length >= 15) return false; // Grab more to filter the best
      
      const titleEl = $(el).find('h2');
      let title = titleEl.text().trim();
      if (!title) {
         title = $(el).find('span.a-text-normal').text().trim();
      }
      
      const relativeUrl = titleEl.find('a').attr('href') || $(el).find('a.a-link-normal').first().attr('href');
      
      const priceWhole = $(el).find('.a-price-whole').first().text().trim().replace(/,/g, '');
      const priceFraction = $(el).find('.a-price-fraction').first().text().trim() || '00';
      const priceStr = priceWhole ? `${priceWhole}.${priceFraction}` : null;
      const price = parsePrice(priceStr);
      
      const img = $(el).find('img.s-image').attr('src');
      const asin = $(el).attr('data-asin');

      // Best Seller / Choice Badge
      const badgeText = $(el).find('.a-badge-text').text().trim();
      const isBestSeller = badgeText && (badgeText.includes('الأكثر مبيعاً') || badgeText.includes('Best Seller') || badgeText.includes('Choice'));

      // Velocity / Sales indicator
      let salesText = '';
      $(el).find('.a-size-base.a-color-secondary').each((_, txtEl) => {
        const text = $(txtEl).text().trim();
        if (text.includes('تم شراء') || text.includes('bought') || text.includes('+')) {
           salesText = text;
        }
      });

      if (title && relativeUrl && price && img && asin) {
        products.push({
          title,
          url: `https://www.amazon.eg/dp/${asin}?tag=bkamelnahar0b-21`,
          price,
          image: img,
          asin,
          isBestSeller,
          salesText
        });
      }
    });

    // Sort products: prioritize best sellers and those with sales text
    products.sort((a, b) => {
      const scoreA = (a.isBestSeller ? 2 : 0) + (a.salesText ? 1 : 0);
      const scoreB = (b.isBestSeller ? 2 : 0) + (b.salesText ? 1 : 0);
      return scoreB - scoreA;
    });

    return products;
  } catch (error) {
    console.error(`Error scraping query "${query}":`, error.message);
    return [];
  }
}

async function run() {
  console.log('--- STARTING CONTINUOUS BEST-SELLER IMPORT PIPELINE ---');

  while (true) {
    console.log('\n--- STEP 1: Subcategory Diagnostics ---');
    const { data: sections, error: secError } = await supabase.from('sections').select('*').eq('type', 'products_by_category');
    const { data: products, error: prodError } = await supabase.from('products').select('category, title, original_url');

    if (secError || prodError) {
      console.error('Failed to fetch data from Supabase', secError, prodError);
      await delay(60000);
      continue;
    }

    if (!sections || !products) {
      console.error('Data is null');
      await delay(60000);
      continue;
    }

    const existingTitles = new Set(products.map(p => p.title.toLowerCase()));
    const existingASINs = new Set(
      products.map(p => extractASIN(p.original_url || '')).filter(Boolean)
    );

    const productCounts = {};
    products.forEach(p => {
      productCounts[p.category] = (productCounts[p.category] || 0) + 1;
    });

    const targetList = [];

    for (const sec of sections) {
      const catId = sec.category || sec.id;
      const currentCount = productCounts[catId] || 0;
      const needed = Math.max(0, 3 - currentCount);

      if (needed > 0) {
        targetList.push({
          id: catId,
          title: sec.title,
          neededCount: needed,
          searchQuery: SEARCH_MAP[sec.title] || sec.title
        });
      }
    }

    const summaryTable = targetList.map(t => ({
      'Category': t.title,
      'Needed': t.neededCount,
      'Query': t.searchQuery
    }));

    console.log(`\n=== PROGRESS SUMMARY ===`);
    const totalCategories = sections.length;
    const completedCategories = totalCategories - targetList.length;
    console.log(`Total Subcategories: ${totalCategories}`);
    console.log(`Completed (>= 3 products): ${completedCategories}`);
    console.log(`Remaining to Process: ${targetList.length}`);
    
    if (targetList.length === 0) {
      console.log('All subcategories have at least 3 products. Sleeping for 1 hour before polling again...');
      await delay(60 * 60 * 1000);
      continue;
    }
    
    console.table(summaryTable);

    console.log('\n--- STEP 2: Stealth Import Loop ---');
    let totalProcessed = 0;

    for (const target of targetList) {
      let importedForTarget = 0;
      
      // We fetch a list of products for this target's search query
      console.log(`\nFetching from Amazon for query: ${target.searchQuery}`);
      const scrapedProducts = await scrapeAmazonSearch(target.searchQuery);
      
      for (const prod of scrapedProducts) {
        if (importedForTarget >= target.neededCount) break;

        if (existingTitles.has(prod.title.toLowerCase()) || existingASINs.has(prod.asin)) {
          continue; // Skip duplicates
        }

        // We found a valid unique product!
        totalProcessed++;
        const productId = generateId();

        // Log immediately
        console.log(`[فئة: ${target.title} - ${importedForTarget + 1}/${target.neededCount} Products Added]`);
        console.log(`Title: ${prod.title.substring(0, 80)}...`);
        if (prod.isBestSeller) console.log(`Badge: 🌟 الأكثر مبيعاً (Best Seller / Choice)`);
        if (prod.salesText) console.log(`Sales: 📈 ${prod.salesText}`);
        console.log(`Price: ${prod.price} EGP`);
        console.log(`Link: ${prod.url}`);

        // Insert into products
        const { error: insertErr } = await supabase.from('products').insert({
          id: productId,
          title: prod.title,
          description: prod.title,
          price: prod.price.toString(),
          original_price: prod.price.toString(),
          image: prod.image,
          category: target.id,
          rating: '0',
          original_url: prod.url,
          created_at: new Date().toISOString()
        });

        if (insertErr) {
           console.error('Insert Error:', insertErr.message);
        }

        // Insert into product_offers
        await supabase.from('product_offers').insert({
          id: 'off_' + crypto.randomBytes(8).toString('hex'),
          product_id: productId,
          store_id: 'amazon',
          price: prod.price.toString(),
          original_price: prod.price.toString(),
          currency: 'EGP',
          product_url: prod.url,
          availability: 'in_stock',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        existingTitles.add(prod.title.toLowerCase());
        existingASINs.add(prod.asin);
        importedForTarget++;
      }

      if (importedForTarget > 0) {
        console.log(`Successfully batched ${importedForTarget} products for "${target.title}".`);
      } else {
        console.log(`No new products found for "${target.title}".`);
      }

      // Delay before moving to the next subcategory
      const msDelay = getRandomDelay();
      const mins = (msDelay / 60000).toFixed(1);
      console.log(`[Stealth] Waiting for ${mins} minutes before moving to the next category...`);
      await delay(msDelay);
    }

    console.log('\n--- Cycle Complete. Restarting poll in 15 seconds... ---');
    await delay(15000);
  }
}

run();
