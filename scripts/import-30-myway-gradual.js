require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const QUEUE_FILE = path.join(__dirname, 'myway-queue.json');
const TARGET_COUNT = 30;

// Subcategories for My Way
const MYWAY_PARENT_ID = 'cat_5db45213e0ac';
const MYWAY_CATS = {
  PERFUMES: 'cat_0896edaf0787', // عطور ماي واي
  BODY_CARE: 'cat_f41dabc050ee', // مجموعات العناية بالجسم
  HOME_CLEANERS: 'cat_dda64458e9b4' // منظفات ومعطرات منزلية
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

function generateId() {
  return 'prod_' + crypto.randomBytes(8).toString('hex');
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  const num = priceStr.replace(/[^\d.]/g, '');
  if (!num) return null;
  return parseFloat(num);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay() {
  // 5 to 12 minutes in ms
  const min = 5 * 60 * 1000;
  const max = 12 * 60 * 1000;
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getQueue() {
  if (fs.existsSync(QUEUE_FILE)) {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  }
  return [];
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// Scrape search page to find ASINs
async function fetchTargetASINs() {
  console.log('🔍 Searching Amazon for My Way products to build the queue...');
  let queue = getQueue();
  
  if (queue.length >= TARGET_COUNT) {
    console.log('✅ Queue already has enough products.');
    return queue;
  }

  const { data: existingProducts } = await supabase.from('products').select('original_url, title');
  const existingASINs = new Set(
    (existingProducts || []).map(p => {
      const match = p.original_url && p.original_url.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/i);
      return match ? match[2] : null;
    }).filter(Boolean)
  );

  let page = 1;
  const newItems = [];

  while (queue.length + newItems.length < TARGET_COUNT && page <= 5) {
    try {
      const url = `https://www.amazon.eg/s?k=${encodeURIComponent('ماي واي')}&page=${page}&language=ar_AE&s=exact-aware-popularity-rank`;
      console.log(`Scraping page ${page}...`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ar-EG,ar;q=0.9',
          'Cookie': 'lc-acbeg=ar_AE; i18n-prefs=EGP;',
          'Cache-Control': 'no-cache'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      let foundOnPage = 0;

      $('.s-result-item[data-asin]').each((_, el) => {
        const asin = $(el).attr('data-asin');
        if (!asin || asin.trim() === '') return;

        const alreadyInQueue = queue.some(q => q.asin === asin) || newItems.some(n => n.asin === asin);
        if (alreadyInQueue || existingASINs.has(asin)) return;

        newItems.push({
          asin: asin,
          url: `https://www.amazon.eg/dp/${asin}?language=ar_AE`,
          status: 'pending',
          startTime: null,
          endTime: null,
          result: null,
          error: null
        });
        foundOnPage++;
        if (queue.length + newItems.length >= TARGET_COUNT) return false; // break loop
      });

      console.log(`Found ${foundOnPage} new ASINs on page ${page}.`);
      page++;
      await delay(3000); // polite delay between pages
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.error('🚨 HTTP 429 Rate Limit encountered during search! Stopping.');
        process.exit(1);
      }
      console.error(`Error scraping page ${page}:`, error.message);
      break;
    }
  }

  queue = [...queue, ...newItems];
  saveQueue(queue);
  console.log(`✅ Queue built with ${queue.length} items.`);
  return queue;
}

async function scrapeProductDetails(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ar-EG,ar;q=0.9',
      'Cookie': 'lc-acbeg=ar_AE; i18n-prefs=EGP;',
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);

  let title = $('#productTitle').text().trim();
  if (!title) throw new Error('Title not found');

  let priceStr = $('.a-price.a-text-price .a-offscreen').first().text().trim() ||
                 $('.a-price .a-offscreen').first().text().trim();
  const price = parsePrice(priceStr);
  if (!price) throw new Error('Price not found');

  let image = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
  if (!image) throw new Error('Image not found');

  // Simple categorization logic
  let targetCat = MYWAY_PARENT_ID;
  const tLower = title.toLowerCase();
  if (tLower.includes('عطر') || tLower.includes('برفان') || tLower.includes('او دي') || tLower.includes('كولونيا')) {
    targetCat = MYWAY_CATS.PERFUMES;
  } else if (tLower.includes('شامبو') || tLower.includes('لوشن') || tLower.includes('كريم') || tLower.includes('شاور') || tLower.includes('بشرة') || tLower.includes('شعر')) {
    targetCat = MYWAY_CATS.BODY_CARE;
  } else if (tLower.includes('منظف') || tLower.includes('معطر') || tLower.includes('صابون') || tLower.includes('تنظيف')) {
    targetCat = MYWAY_CATS.HOME_CLEANERS;
  } else {
    // Default to body care if unable to determine
    targetCat = MYWAY_CATS.BODY_CARE;
  }

  return { title, price, image, category: targetCat };
}

async function main() {
  console.log('🚀 Starting Gradual Import of My Way Products...');
  
  const queue = await fetchTargetASINs();
  
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    
    if (item.status === 'completed') {
      console.log(`[${i + 1}/${TARGET_COUNT}] SKIPPING - ASIN ${item.asin} already completed.`);
      continue;
    }

    console.log(`\n[${i + 1}/${TARGET_COUNT}] PROCESSING - ASIN: ${item.asin}`);
    console.log(`URL: ${item.url}`);
    
    item.startTime = new Date().toISOString();
    item.status = 'processing';
    saveQueue(queue);

    try {
      const details = await scrapeProductDetails(item.url);
      
      const productId = generateId();
      
      const { error: insertErr } = await supabase.from('products').insert({
        id: productId,
        title: details.title,
        description: details.title, // Use title as description for now
        price: details.price.toString(),
        original_price: details.price.toString(),
        image: details.image,
        category: details.category,
        original_url: item.url
      });

      if (insertErr) {
        throw new Error(`DB Insert Error: ${insertErr.message}`);
      }

      item.status = 'completed';
      item.endTime = new Date().toISOString();
      item.result = `Added as ${productId} to category ${details.category}`;
      item.error = null;
      console.log(`✅ SUCCESS: ${details.title.substring(0, 50)}...`);
      console.log(`Price: ${details.price} EGP`);
      
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.error('🚨 HTTP 429 Rate Limit encountered! Stopping entire pipeline immediately.');
        item.status = 'rate_limited';
        item.endTime = new Date().toISOString();
        item.error = 'HTTP 429 Rate Limit';
        saveQueue(queue);
        process.exit(1);
      }

      item.status = 'failed';
      item.endTime = new Date().toISOString();
      item.error = error.message;
      console.log(`❌ FAILED: ${error.message}`);
    }

    saveQueue(queue);

    // If there are more items to process, wait
    if (i < queue.length - 1) {
      const delayMs = getRandomDelay();
      const delayMins = (delayMs / 60000).toFixed(2);
      console.log(`⏳ Waiting for ${delayMins} minutes before next product...`);
      await delay(delayMs);
    }
  }

  console.log('\n🎉 Gradual Import Process Finished!');
  process.exit(0);
}

main();
