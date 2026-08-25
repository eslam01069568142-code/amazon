const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: products } = await supabaseAdmin.from('products').select('id, title, category');
  const { data: existingCategories } = await supabaseAdmin.from('sections').select('id, title, category, type').eq('type', 'products_by_category');
  
  const categoryIdToName = new Map();
  if (existingCategories) {
    for (const cat of existingCategories) {
      if (cat.title) {
        categoryIdToName.set(cat.category, cat.title);
      }
    }
  }

  const results = products.map(p => ({
    title: p.title,
    currentCategory: categoryIdToName.get(p.category) || p.category
  }));
  
  console.log(JSON.stringify(results, null, 2));
}

run();
