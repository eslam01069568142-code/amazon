require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- STARTING ISOLATED TEST FIX ---');
  
  const targetProductId = 'prod_B0go07muW';
  const targetOfferId = 'offer_qdqx37a7y';
  const newPrice = 379;

  console.log(`\n1. Fetching current state of offer: ${targetOfferId}...`);
  const { data: beforeOffer, error: fetchErr } = await supabase
    .from('product_offers')
    .select('*')
    .eq('id', targetOfferId)
    .single();

  if (fetchErr) {
    console.error('Failed to fetch offer:', fetchErr);
    return;
  }

  console.log('Current Offer State:', JSON.stringify(beforeOffer, null, 2));

  if (beforeOffer.price !== null) {
    console.log('WARNING: Offer price is not NULL anymore. It is:', beforeOffer.price);
  }

  console.log(`\n2. Updating offer ${targetOfferId} price to ${newPrice}...`);
  const { error: updateErr } = await supabase
    .from('product_offers')
    .update({ price: newPrice, updated_at: new Date().toISOString() })
    .eq('id', targetOfferId);

  if (updateErr) {
    console.error('Failed to update offer:', updateErr);
    return;
  }

  console.log('Update command executed.');

  console.log(`\n3. Verifying updated state...`);
  const { data: afterOffer, error: verifyErr } = await supabase
    .from('product_offers')
    .select('*')
    .eq('id', targetOfferId)
    .single();

  if (verifyErr) {
    console.error('Failed to verify offer:', verifyErr);
    return;
  }

  console.log('Updated Offer State:', JSON.stringify(afterOffer, null, 2));

  if (afterOffer.price === newPrice) {
    console.log('\n✅ SUCCESS: Price updated correctly to', newPrice);
  } else {
    console.error('\n❌ ERROR: Price update failed. Current price is', afterOffer.price);
  }

  console.log('\n--- ISOLATED TEST FIX COMPLETE ---');
}

main().catch(console.error);
