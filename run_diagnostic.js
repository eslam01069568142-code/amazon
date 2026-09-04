const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runDiagnostic() {
  try {
    // 1. Fetch the 14 invalid Amazon Offers (price IS NULL or <= 0 or NaN)
    const { data: invalidOffers, error: err1 } = await supabase
      .from('product_offers')
      .select('*, products(*), stores(id, name)')
      .or('price.is.null,price.lte.0');

    // 2. Fetch the 3 Products without offers
    const { data: allProducts, error: err2 } = await supabase.from('products').select('*');
    const { data: allOffers, error: err3 } = await supabase.from('product_offers').select('product_id');

    const offerProductIds = new Set((allOffers || []).map(o => o.product_id));
    const noOfferProducts = (allProducts || []).filter(p => !offerProductIds.has(p.id));

    // Evaluate Phase 3 reasons for the 14 offers
    const missingPriceOffers = invalidOffers?.map(o => {
      let reason = 'UNKNOWN';
      if (o.availability === 'out_of_stock' || o.availability === 'unavailable') {
        reason = 'UNAVAILABLE';
      } else if (o.price === null) {
        reason = 'PRICE_MISSING';
      } else if (o.price <= 0) {
        reason = 'INVALID';
      }

      // If price is missing but availability is in_stock, might be scrape failure
      if (reason === 'PRICE_MISSING' && o.availability === 'in_stock') {
        reason = 'SCRAPE_FAILURE_LIKELY';
      }

      return {
        offer: {
          id: o.id,
          product_id: o.product_id,
          store_id: o.store_id,
          store_name: o.stores?.name,
          price: o.price,
          original_price: o.original_price,
          currency: o.currency,
          availability: o.availability,
          product_url: o.product_url,
          affiliate_url: o.affiliate_url,
          last_checked_at: o.last_checked_at,
          created_at: o.created_at
        },
        product: o.products ? {
          id: o.products.id,
          title: o.products.title,
          category: o.products.category,
          is_my_way: o.products.is_my_way,
          original_url: o.products.original_url,
          created_at: o.products.created_at
        } : null,
        reason
      };
    });

    const noOffersDetails = noOfferProducts.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      is_my_way: p.is_my_way,
      original_url: p.original_url,
      affiliate_link: p.affiliate_link,
      created_at: p.created_at
    }));

    console.log(JSON.stringify({
      invalidOffers: missingPriceOffers,
      noOfferProducts: noOffersDetails
    }, null, 2));

  } catch (error) {
    console.error("Diagnostic Error:", error);
  }
}

runDiagnostic();
