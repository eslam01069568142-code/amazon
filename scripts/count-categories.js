require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Fetching data from Supabase...');
  
  // 1. Fetch categories
  const { data: sections, error: sectionsErr } = await supabase
    .from('sections')
    .select('title, category')
    .eq('type', 'products_by_category')
    .not('category', 'is', null);

  if (sectionsErr) {
    console.error('Failed to fetch sections:', sectionsErr);
    return;
  }

  // 2. Fetch all products to count efficiently
  const { data: products, error: productsErr } = await supabase
    .from('products')
    .select('id, category');

  if (productsErr) {
    console.error('Failed to fetch products:', productsErr);
    return;
  }

  // Map product counts
  const categoryCounts = {};
  for (const product of products) {
    if (product.category) {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    }
  }

  // Format table data
  const tableData = sections.map(section => {
    const count = categoryCounts[section.category] || 0;
    return {
      'Category Name': section.title,
      'Category ID': section.category,
      'Product Count': count,
      'Status': count > 0 ? '🟢 Active' : '🔴 Empty'
    };
  });

  // Sort by count descending
  tableData.sort((a, b) => b['Product Count'] - a['Product Count']);

  console.log('\n--- Categories Product Count Audit ---');
  console.table(tableData);

  console.log(`\n📦 Total Categories Found: ${sections.length}`);
  console.log(`📦 Total Products in Database: ${products.length}`);
}

main().catch(console.error);
