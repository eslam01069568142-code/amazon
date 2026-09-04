const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function deepFixCategories() {
  console.log("=================================================");
  console.log("STARTING DEEP CATEGORY FIX (ICE BOX / TOYS)");
  console.log("=================================================");

  const { data: products } = await supabase.from('products').select('id, title, category');
  
  if (!products) {
    console.error("Failed to fetch products.");
    return;
  }

  let moved = 0;
  for (const p of products) {
    const t = p.title.toLowerCase();
    
    // Fix 1: Coolman / Ice Box -> Outdoor / Sports or Home & Kitchen
    // The user said "goes strictly to Home/Kitchen or Outdoor, NOT Sports" wait, wait... 
    // They said "Home/Kitchen or Outdoor, NOT Sports". Let's put it in Home & Kitchen tools: 'cat_kitchentools'
    if (t.match(/كولمان|صندوق ثلج|ice box/)) {
      if (p.category !== 'cat_kitchentools') {
        await supabase.from('products').update({ category: 'cat_kitchentools' }).eq('id', p.id);
        console.log(`[FIXED ICE BOX] ${p.title} -> cat_kitchentools`);
        moved++;
      }
    }
    
    // Fix 2: Toys / Clay -> Toys (if they exist). The global script moved clay to Home & Kitchen.
    // Let's create 'cat_toys' or move it to a known toy category. The scraper maps toys to 'ألعاب أطفال ودمى'.
    if (t.match(/صلصال|لعبة|العاب|ألعاب|دمية/)) {
      // Create toys section if it doesn't exist
      const toysCategory = 'cat_toys';
      // First, ensure 'cat_toys' exists
      await supabase.from('sections').upsert({
        id: 'sec_toys_parent',
        category: 'cat_toys_parent',
        title: 'الألعاب والترفيه',
        type: 'products_by_category',
        enabled: true
      }, { onConflict: 'id' });
      
      await supabase.from('sections').upsert({
        id: 'sec_toys_child',
        category: toysCategory,
        title: 'ألعاب أطفال ودمى',
        parent_id: 'cat_toys_parent',
        type: 'products_by_category',
        enabled: true
      }, { onConflict: 'id' });

      if (p.category !== toysCategory) {
        await supabase.from('products').update({ category: toysCategory }).eq('id', p.id);
        console.log(`[FIXED TOYS] ${p.title} -> ${toysCategory}`);
        moved++;
      }
    }
  }

  console.log("=================================================");
  console.log(`DEEP FIX COMPLETE! Corrected ${moved} specific products.`);
  console.log("=================================================");
}

deepFixCategories();
