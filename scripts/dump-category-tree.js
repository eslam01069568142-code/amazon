require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('🔄 Fetching categories and products from Supabase...\n');

  const { data: sections, error: secError } = await supabase
    .from('sections')
    .select('id, category, title, enabled, parent_id, type')
    .order('order_index', { ascending: true });

  if (secError) {
    console.error('❌ Failed to fetch sections:', secError);
    process.exit(1);
  }

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, title, category');

  if (prodError) {
    console.error('❌ Failed to fetch products:', prodError);
    process.exit(1);
  }

  // Build the tree and map data
  const categoryMap = new Map();
  
  // Initialize with sections
  sections.forEach(sec => {
    const catId = sec.category || sec.id;
    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        id: catId,
        title: sec.title,
        enabled: sec.enabled,
        parent_id: sec.parent_id,
        isMegaMenuVisible: sec.enabled && sec.category !== null, // approximate logic for visibility
        products: []
      });
    }
  });

  // Assign products
  products.forEach(p => {
    const catId = p.category;
    if (!categoryMap.has(catId)) {
      // Orphaned / unregistered category
      categoryMap.set(catId, {
        id: catId,
        title: '⚠️ UNREGISTERED/ORPHANED',
        enabled: false,
        parent_id: null,
        isMegaMenuVisible: false,
        products: []
      });
    }
    categoryMap.get(catId).products.push(p.title);
  });

  const categories = Array.from(categoryMap.values());
  let totalCategories = categories.length;
  let activeCategories = 0;
  let emptyCategories = 0;
  let missingFromMegaMenu = 0;

  console.log('====================================================');
  console.log('             🌳 CATEGORY TREE AUDIT 🌳              ');
  console.log('====================================================\n');

  categories.sort((a, b) => b.products.length - a.products.length).forEach(cat => {
    const pCount = cat.products.length;
    
    if (pCount > 0) activeCategories++;
    else emptyCategories++;
    
    if (!cat.isMegaMenuVisible) missingFromMegaMenu++;

    const statusBadge = cat.isMegaMenuVisible ? '✅ VISIBLE' : '❌ HIDDEN/ORPHANED';
    
    console.log(`📁 [${cat.title}] (ID: ${cat.id})`);
    console.log(`   Status: ${statusBadge} | Products: ${pCount}`);
    
    if (pCount > 0) {
      console.log('   Sample Products:');
      cat.products.slice(0, 2).forEach(pt => {
        console.log(`     - ${pt.substring(0, 70)}...`);
      });
    }
    console.log('');
  });

  console.log('====================================================');
  console.log('                  📊 SUMMARY 📊                     ');
  console.log('====================================================');
  console.log(`Total Categories (in DB):       ${totalCategories}`);
  console.log(`Active Categories (>0 items):   ${activeCategories}`);
  console.log(`Empty Categories (0 items):     ${emptyCategories}`);
  console.log(`Hidden/Missing from Mega Menu:  ${missingFromMegaMenu}`);
  console.log('====================================================\n');

  process.exit(0);
}

main();
