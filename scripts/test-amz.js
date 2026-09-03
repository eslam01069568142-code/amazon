const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("RUNNING REPAIR ON UNRESOLVED APPAREL & CATALOG PRODUCTS...");
  const { data: products } = await supabase
    .from('products')
    .select('id, title, category, price, original_url')
    .or('price.is.null,price.eq.Price unavailable,price.eq.0');

  console.log(`FOUND ${products?.length} PRODUCTS TO REPAIR`);
  const cheerio = require('cheerio');

  for (const p of (products || [])) {
    if (!p.original_url) continue;
    console.log(`\nRe-scraping Product: ${p.id} (${p.title})`);
    try {
      const res = await fetch(p.original_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        redirect: 'follow'
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        let priceElem = $('#corePrice_feature_div .a-price .a-offscreen').first().text().trim() ||
                        $('.priceToPay .a-offscreen').first().text().trim() ||
                        $('#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen').first().text().trim() ||
                        $('#corePrice_desktop .priceToPay .a-offscreen').first().text().trim() ||
                        $('#tp_price_block_total_price_ww .a-offscreen').first().text().trim() ||
                        $('#apex_desktop .a-price .a-offscreen').first().text().trim() ||
                        $('span[data-a-color="price"] .a-offscreen').first().text().trim() ||
                        $('.a-price .a-offscreen').first().text().trim() ||
                        $('.a-price-whole').first().text().trim();

        if (priceElem) {
          console.log(`-> SUCCESS! Price extracted: ${priceElem}`);
          await supabase.from('products').update({ price: priceElem }).eq('id', p.id);
        } else {
          console.log(`-> Price still empty for ${p.id}`);
        }
      }
    } catch(err) {
      console.log(`-> Error: ${err.message}`);
    }
  }
}

run();
