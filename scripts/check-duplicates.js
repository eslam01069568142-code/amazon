require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  const { data: offers } = await supabase.from('product_offers').select('product_id, store_id, affiliate_url');
  const asins = {};
  const duplicates = [];
  
  for (const o of offers) {
    if (o.store_id === 'store_amazon') {
      const match = o.affiliate_url?.match(/dp\/([A-Z0-9]{10})/);
      if (match) {
        const asin = match[1];
        if (asins[asin]) {
          duplicates.push({ asin, product_ids: [asins[asin], o.product_id] });
        } else {
          asins[asin] = o.product_id;
        }
      }
    }
  }
  console.log(`Found ${duplicates.length} duplicate ASINs.`);
  if (duplicates.length > 0) console.log(duplicates);
}

checkDuplicates().catch(console.error);
