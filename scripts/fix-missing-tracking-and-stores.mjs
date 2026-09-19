import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

import crypto from 'crypto';

function generateId() {
  return 'offer_' + crypto.randomBytes(8).toString('hex');
}

function extractASIN(url) {
  if (!url) return null;
  const match = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return match ? match[1] : null;
}

async function main() {
  console.log('🚀 Starting Fix for Missing Tracking and Stores...\n');

  // 1. Fetch active affiliate tracking_id
  let trackingId = 'bkamelnahar0b-21'; // fallback
  const { data: settingsData } = await supabase.from('settings').select('*').single();
  if (settingsData && settingsData.amazon_affiliate_tag) {
    trackingId = settingsData.amazon_affiliate_tag;
    console.log(`✅ Loaded affiliate tag from settings: ${trackingId}`);
  } else {
    console.log(`⚠️ Affiliate tag not found in settings. Using fallback: ${trackingId}`);
  }

  // 2. Ensure store_amazon exists
  const storeId = 'store_amazon';
  const { error: storeErr } = await supabase.from('stores').upsert({
    id: storeId,
    name: 'Amazon',
    slug: 'amazon',
    website_url: 'https://amazon.eg',
    affiliate_enabled: true,
    enabled: true
  }, { onConflict: 'id' });

  if (storeErr) {
    console.error('❌ Failed to upsert store_amazon:', storeErr);
    process.exit(1);
  }
  console.log(`✅ Verified 'store_amazon' in stores table.`);

  // 3. Fetch all products and their offers
  console.log('Fetching all products and offers...');
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*, product_offers(*)');

  if (prodErr || !products) {
    console.error('❌ Failed to fetch products:', prodErr);
    process.exit(1);
  }
  console.log(`📦 Found ${products.length} total products.`);

  let fixCount = 0;

  for (const product of products) {
    // Check if product lacks a proper offer
    const hasValidOffer = product.product_offers && product.product_offers.some(offer => {
      return offer.store_id === storeId && offer.affiliate_url && offer.affiliate_url.includes(`tag=${trackingId}`);
    });

    if (!hasValidOffer) {
      // Find ASIN from existing offer URL or product original_url
      let asin = null;
      let existingPrice = product.price || 0;
      let existingOriginalPrice = product.original_price || product.price || 0;
      
      if (product.original_url) {
        asin = extractASIN(product.original_url);
      }
      
      if (!asin && product.product_offers && product.product_offers.length > 0) {
        asin = extractASIN(product.product_offers[0].affiliate_url || product.product_offers[0].product_url);
        if (!existingPrice) existingPrice = product.product_offers[0].price;
        if (!existingOriginalPrice) existingOriginalPrice = product.product_offers[0].original_price;
      }

      if (asin) {
        const correctUrl = `https://www.amazon.eg/dp/${asin}?tag=${trackingId}&linkCode=ogi&th=1&psc=1`;
        
        // Define the offer record
        const offerData = {
          id: generateId(),
          product_id: product.id,
          store_id: storeId,
          product_url: correctUrl,
          affiliate_url: correctUrl,
          price: existingPrice,
          original_price: existingOriginalPrice,
          currency: 'EGP',
          availability: 'in_stock'
        };

        // Check if there's an existing offer to update, or if we need to insert a new one
        if (product.product_offers && product.product_offers.length > 0) {
          const firstOffer = product.product_offers[0];
          const { error: updateErr } = await supabase
            .from('product_offers')
            .update({ 
               store_id: storeId, 
               product_url: correctUrl,
               affiliate_url: correctUrl,
               currency: 'EGP',
               availability: 'in_stock'
            })
            .eq('id', firstOffer.id);
            
          if (updateErr) {
            console.error(`❌ Failed to update offer for ${product.id}:`, updateErr.message);
          } else {
            fixCount++;
          }
        } else {
          // Insert new offer
          const { error: insertErr } = await supabase
            .from('product_offers')
            .insert([offerData]);
            
          if (insertErr) {
            console.error(`❌ Failed to insert offer for ${product.id}:`, insertErr.message);
          } else {
            fixCount++;
          }
        }
      } else {
         // Couldn't extract ASIN, might be a noon product or malformed URL
      }
    }
  }

  console.log(`\n🎉 Process Complete! Fixed / Upserted ${fixCount} missing tracking links and stores.`);
  process.exit(0);
}

main();
