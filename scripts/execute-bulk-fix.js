require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseNumericPrice(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

async function main() {
  console.log('--- STARTING BULK FIX ---');

  // --- 1. Fix 13 Offers ---
  console.log('\n[1/2] Fixing Amazon Offers with NULL prices...');
  const { data: offersToFix, error: offersErr } = await supabase
    .from('product_offers')
    .select('*, products(id, title, price)')
    .eq('store_id', 'store_amazon')
    .is('price', null)
    .eq('availability', 'in_stock');

  if (offersErr) {
    console.error('Failed to fetch offers:', offersErr);
    return;
  }

  console.log(`Found ${offersToFix.length} offers to fix.`);

  let updatedCount = 0;
  for (const offer of offersToFix) {
    const productRawPrice = offer.products?.price;
    const numericPrice = parseNumericPrice(productRawPrice);

    if (numericPrice !== null) {
      console.log(`Updating offer ${offer.id} (Product: ${offer.products.id}) - Price: ${numericPrice}`);
      const { error: updateErr } = await supabase
        .from('product_offers')
        .update({ price: numericPrice, updated_at: new Date().toISOString() })
        .eq('id', offer.id);

      if (updateErr) {
        console.error(`Failed to update offer ${offer.id}:`, updateErr);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`Skipping offer ${offer.id} - Could not parse product price from "${productRawPrice}"`);
    }
  }
  
  console.log(`✅ Fixed ${updatedCount} out of ${offersToFix.length} offers.`);

  // --- 2. Delete Orphaned Products ---
  console.log('\n[2/2] Deleting orphaned products...');
  
  const { data: allProducts, error: prodErr } = await supabase.from('products').select('id');
  if (prodErr) {
    console.error('Failed to fetch products:', prodErr);
    return;
  }
  
  const { data: allOffers, error: allOffErr } = await supabase.from('product_offers').select('product_id');
  if (allOffErr) {
    console.error('Failed to fetch offers for orphans check:', allOffErr);
    return;
  }

  const productsWithOffers = new Set(allOffers.map(o => o.product_id));
  const orphanedProductIds = allProducts.filter(p => !productsWithOffers.has(p.id)).map(p => p.id);

  console.log(`Found ${orphanedProductIds.length} orphaned products:`, orphanedProductIds);

  if (orphanedProductIds.length > 0) {
    const { error: delErr } = await supabase
      .from('products')
      .delete()
      .in('id', orphanedProductIds);
    
    if (delErr) {
      console.error('Failed to delete orphaned products:', delErr);
    } else {
      console.log(`✅ Deleted ${orphanedProductIds.length} orphaned products.`);
    }
  } else {
    console.log('No orphaned products to delete.');
  }

  console.log('\n--- BULK FIX COMPLETE ---');
}

main().catch(console.error);
