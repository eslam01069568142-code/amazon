import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('🚀 Starting Tracking ID Update Migration...\n');

  const newTag = 'bkamelnahar0b-21';
  const oldTagFragment = 'bkam09-21';

  // 1. Update public.settings
  console.log('Updating tracking_id in public.settings...');
  // Assuming there's only one row in settings, or we update the 'amazon_affiliate_tag'
  const { data: currentSettings, error: fetchSettingsErr } = await supabase.from('settings').select('*').limit(1);
  if (!fetchSettingsErr && currentSettings && currentSettings.length > 0) {
    const settingId = currentSettings[0].id;
    const { error: updateSetErr } = await supabase
      .from('settings')
      .update({ amazon_affiliate_tag: newTag })
      .eq('id', settingId);

    if (updateSetErr) {
      console.error('❌ Failed to update settings:', updateSetErr);
    } else {
      console.log('✅ Successfully updated public.settings to new tag:', newTag);
    }
  } else {
    console.warn('⚠️ No settings found to update.');
  }

  // 2. Update product_offers
  console.log('\nFetching Amazon product offers...');
  const { data: offers, error: fetchOffersErr } = await supabase
    .from('product_offers')
    .select('id, product_url, affiliate_url')
    .eq('store_id', 'store_amazon');

  if (fetchOffersErr) {
    console.error('❌ Failed to fetch product offers:', fetchOffersErr);
    process.exit(1);
  }

  console.log(`📦 Found ${offers.length} Amazon offers.`);
  
  let updateCount = 0;
  for (const offer of offers) {
    let needsUpdate = false;
    let newAffiliateUrl = offer.affiliate_url;
    let newProductUrl = offer.product_url;

    // We will ensure the format:
    // https://www.amazon.eg/dp/{asin}?tag=bkamelnahar0b-21&linkCode=ogi&th=1&psc=1
    // We can extract ASIN and reconstruct.
    const extractASIN = (url) => {
      if (!url) return null;
      const match = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      return match ? match[1] : null;
    };

    const asin = extractASIN(offer.affiliate_url) || extractASIN(offer.product_url);

    if (asin) {
      const correctUrl = `https://www.amazon.eg/dp/${asin}?tag=${newTag}&linkCode=ogi&th=1&psc=1`;
      if (offer.affiliate_url !== correctUrl || offer.product_url !== correctUrl) {
        newAffiliateUrl = correctUrl;
        newProductUrl = correctUrl;
        needsUpdate = true;
      }
    } else if (offer.affiliate_url && offer.affiliate_url.includes(oldTagFragment)) {
      // Fallback if no ASIN found but old tag is present
      newAffiliateUrl = offer.affiliate_url.replace(oldTagFragment, newTag);
      newProductUrl = offer.product_url ? offer.product_url.replace(oldTagFragment, newTag) : newAffiliateUrl;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error: updateErr } = await supabase
        .from('product_offers')
        .update({
          affiliate_url: newAffiliateUrl,
          product_url: newProductUrl
        })
        .eq('id', offer.id);
        
      if (updateErr) {
        console.error(`❌ Failed to update offer ${offer.id}:`, updateErr.message);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`\n🎉 Process Complete! Updated ${updateCount} Amazon product offers.`);
  process.exit(0);
}

main();
