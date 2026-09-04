const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runAudit() {
  try {
    // 1. Fetch tables structures (columns)
    // We can just fetch a single row to infer structure, or query information_schema if accessible.
    const { data: pData } = await supabase.from('products').select('*').limit(1);
    const { data: oData } = await supabase.from('product_offers').select('*').limit(1);
    const { data: sData } = await supabase.from('stores').select('*').limit(1);
    
    // 2. Fetch stats
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: totalOffers } = await supabase.from('product_offers').select('*', { count: 'exact', head: true });
    const { count: totalMyWay } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_my_way', true);
    const { count: totalNoPrice } = await supabase.from('products').select('*', { count: 'exact', head: true }).is('price', null);

    // Fetch all offers to aggregate locally (assuming small DB size < 1000)
    const { data: allOffers } = await supabase.from('product_offers').select('*, stores(name, id)');
    const { data: allProducts } = await supabase.from('products').select('id, original_url, price');
    
    let amazonOffersCount = 0;
    let noonOffersCount = 0;
    let invalidPriceOffers = 0;
    let invalidProductUrlOffers = 0;
    let invalidAffiliateUrlOffers = 0;

    const productOffersMap = {};

    if (allOffers) {
      allOffers.forEach(o => {
        const storeName = o.stores?.name?.toLowerCase() || '';
        if (storeName.includes('amazon')) amazonOffersCount++;
        if (storeName.includes('noon')) noonOffersCount++;
        
        if (o.price === null || isNaN(o.price)) invalidPriceOffers++;
        if (!o.product_url || o.product_url.trim() === '') invalidProductUrlOffers++;
        if (!o.affiliate_url || o.affiliate_url.trim() === '') invalidAffiliateUrlOffers++;

        if (!productOffersMap[o.product_id]) productOffersMap[o.product_id] = [];
        productOffersMap[o.product_id].push(storeName);
      });
    }

    let amazonOnly = 0;
    let noonOnly = 0;
    let amazonAndNoon = 0;
    let noOffers = 0;

    if (allProducts) {
      allProducts.forEach(p => {
        const stores = productOffersMap[p.id] || [];
        const hasAmz = stores.some(s => s.includes('amazon'));
        const hasNoon = stores.some(s => s.includes('noon'));

        if (hasAmz && hasNoon) amazonAndNoon++;
        else if (hasAmz) amazonOnly++;
        else if (hasNoon) noonOnly++;
        else noOffers++;
      });
    }

    console.log(JSON.stringify({
      structure: {
        products: pData ? Object.keys(pData[0] || {}) : [],
        product_offers: oData ? Object.keys(oData[0] || {}) : [],
        stores: sData ? Object.keys(sData[0] || {}) : []
      },
      stats: {
        totalProducts,
        totalOffers,
        amazonOffersCount,
        noonOffersCount,
        amazonOnly,
        noonOnly,
        amazonAndNoon,
        noOffers,
        totalNoPrice,
        invalidPriceOffers,
        invalidProductUrlOffers,
        invalidAffiliateUrlOffers,
        totalMyWay
      }
    }, null, 2));

  } catch (error) {
    console.error("Error running audit:", error);
  }
}

runAudit();
