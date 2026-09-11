require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: products, error } = await supabase.from('products').select('category, created_at');
  const { data: sections, error: secError } = await supabase.from('sections').select('id, category, title').eq('enabled', true);

  if (error || secError) {
    console.error('Error fetching data:', error || secError);
    return;
  }

  // 1. Total products
  console.log(`\n=== Total Products ===`);
  console.log(`Total: ${products.length}`);

  // 2. New products today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newProductsToday = products.filter(p => {
    const d = new Date(p.created_at || p.createdAt);
    return d >= today;
  });

  console.log(`\n=== Products Imported Today ===`);
  console.log(`Imported Today: ${newProductsToday.length}`);

  // 3. Categories and counts
  const productCounts = {};
  products.forEach(p => {
    const cat = p.category;
    if (cat) {
      productCounts[cat] = (productCounts[cat] || 0) + 1;
    }
  });

  console.log(`\n=== Active Categories Breakdown ===`);
  // Map section IDs to counts
  const categoryStats = [];
  sections.forEach(sec => {
     if (sec.type !== 'products_by_category' && !sec.category) return;
     const catId = sec.category || sec.id;
     categoryStats.push({
       'Category Name': sec.title,
       'Count': productCounts[catId] || 0
     });
  });

  // Also catch products that have categories not in sections or directly matched
  const knownCategories = new Set(categoryStats.map(s => s.Category));
  
  categoryStats.sort((a, b) => b.Count - a.Count);
  console.table(categoryStats);
}

run();
