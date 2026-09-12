require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Fetching "المنزل والمطبخ" category ID...');
  const { data: categories, error: catError } = await supabase
    .from('sections')
    .select('id, category')
    .eq('title', 'المنزل والمطبخ')
    .limit(1);

  if (catError || !categories || categories.length === 0) {
    console.error('Failed to find category:', catError);
    process.exit(1);
  }

  const kitchenCatId = categories[0].category || categories[0].id;
  console.log('Found Kitchen Category ID:', kitchenCatId);

  console.log('Fetching cooler product...');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, title, category')
    .ilike('title', '%خزان الثلج%');

  if (prodError || !products || products.length === 0) {
    console.error('Failed to find cooler product:', prodError);
    process.exit(1);
  }

  const cooler = products[0];
  console.log('Found Cooler:', cooler.title, 'Current Category:', cooler.category);

  console.log('Moving to new category...');
  const { error: updateError } = await supabase
    .from('products')
    .update({ category: kitchenCatId })
    .eq('id', cooler.id);

  if (updateError) {
    console.error('Failed to update product:', updateError);
    process.exit(1);
  }

  console.log('✅ Successfully moved cooler to', kitchenCatId);
  process.exit(0);
}

main();
