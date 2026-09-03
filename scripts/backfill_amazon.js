const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runBackfill() {
  console.log('--- Data Integrity Pre-Check ---');

  // 1. Get Tracking ID
  const { data: settingsData } = await supabase.from('settings').select('*').single();
  const trackingId = settingsData?.tracking_id || 'bkam09-21';

  function getAmazonProductUrl(product, trackingId) {
    try {
      const urlObj = new URL(product.original_url);
      if (urlObj.hostname.includes('amzn.to')) {
        return product.original_url;
      }
      const asinMatch = product.original_url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);
      if (asinMatch && asinMatch[1]) {
        return `https://www.amazon.eg/dp/${asinMatch[1]}?tag=${trackingId}&linkCode=ogi&th=1&psc=1`;
      }
      urlObj.searchParams.set('tag', trackingId);
      urlObj.searchParams.set('linkCode', 'ogi');
      return urlObj.toString();
    } catch (e) {
      return product.original_url;
    }
  }

  // 2. Fetch all products
  const { data: products, error: prodErr } = await supabase.from('products').select('*');
  if (prodErr) throw prodErr;

  // 3. Filter Amazon products
  const amazonProducts = products.filter(p => p.original_url && p.original_url.toLowerCase().includes('amazon'));
  console.log(`Total Amazon Products Found: ${amazonProducts.length}`);

  // 4. Fetch all Amazon Offers
  const { data: offers, error: offErr } = await supabase.from('product_offers').select('*').eq('store_id', 'store_amazon');
  if (offErr) throw offErr;
  
  const existingOfferProductIds = new Set(offers.map(o => o.product_id));
  console.log(`Existing Amazon Offers: ${offers.length}`);

  // 5. Products without offers
  const missingOffers = amazonProducts.filter(p => !existingOfferProductIds.has(p.id));
  console.log(`Amazon Products Without Offer: ${missingOffers.length}`);

  if (missingOffers.length === 0) {
    console.log('No backfill needed.');
    return;
  }

  const parsePrice = (p) => {
    if (!p) return null;
    const num = parseFloat(p.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  };

  const rowsToInsert = missingOffers.map(p => {
    return {
      id: 'offer_' + Math.random().toString(36).substr(2, 9),
      product_id: p.id,
      store_id: 'store_amazon',
      price: parsePrice(p.price),
      original_price: parsePrice(p.original_price),
      currency: 'EGP',
      product_url: p.original_url,
      affiliate_url: getAmazonProductUrl(p, trackingId),
      availability: 'in_stock',
      created_at: new Date().toISOString()
    };
  });

  console.log(`Rows to insert: ${rowsToInsert.length}`);

  // 6. Insert
  const { error: insertErr } = await supabase.from('product_offers').insert(rowsToInsert);
  if (insertErr) {
    console.error('Insert Failed:', insertErr);
    return;
  }

  console.log('--- Backfill Complete ---');
  const { count: finalCount } = await supabase.from('product_offers').select('*', { count: 'exact', head: true }).eq('store_id', 'store_amazon');
  console.log(`Total Amazon Offers now: ${finalCount}`);
}

runBackfill().catch(console.error);
