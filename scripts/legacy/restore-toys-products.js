const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findToysAndRestore2() {
  console.log("=================================================");
  console.log("RESTORING TOYS PRODUCTS (2)");
  console.log("=================================================");

  const { data: sections } = await supabase.from('sections').select('id, category, title, parent_id');
  
  const toyParent = sections.find(s => s.title.includes('ترفيه') || s.title.includes('ألعاب') || s.title.includes('العاب'));
  console.log("Found parent:", toyParent);

  let targetCatId = null;

  if (toyParent) {
    const children = sections.filter(s => s.parent_id === toyParent.category);
    console.log("Found children:", children);
    
    const targetChild = children.find(s => s.title.includes('أطفال') || s.title.includes('دمى')) || children[0];
    
    if (targetChild) {
      targetCatId = targetChild.category;
      console.log(`Will assign to: ${targetChild.title} (${targetCatId})`);
    } else {
      console.log("Parent has no children! Creating child...");
      targetCatId = 'cat_toys_child_fallback';
      await supabase.from('sections').upsert({
        id: 'sec_toys_fallback',
        category: targetCatId,
        title: 'ألعاب أطفال ودمى',
        parent_id: toyParent.category,
        type: 'products_by_category',
        enabled: true
      });
    }
  } else {
    console.log("Re-creating Toys parent from scratch...");
    await supabase.from('sections').upsert({
      id: 'sec_toys_parent',
      category: 'cat_toys_parent',
      title: 'الألعاب والترفيه',
      type: 'products_by_category',
      enabled: true
    });
    
    targetCatId = 'cat_toys_child';
    await supabase.from('sections').upsert({
      id: 'sec_toys_child',
      category: targetCatId,
      title: 'ألعاب أطفال ودمى',
      parent_id: 'cat_toys_parent',
      type: 'products_by_category',
      enabled: true
    });
  }

  // 2. Find the products and move them
  const { data: products } = await supabase.from('products').select('id, title, category');
  let moved = 0;
  
  for (const p of products) {
    const t = p.title.toLowerCase();
    // 3. Reassign "صلصال سحري" and any other toy
    if (t.match(/صلصال|لعبة|العاب|ألعاب|دمية/)) {
      if (p.category !== targetCatId) {
        await supabase.from('products').update({ category: targetCatId }).eq('id', p.id);
        console.log(`[RESTORED] ${p.title} -> ${targetCatId}`);
        moved++;
      }
    }
  }

  console.log(`✅ Successfully restored ${moved} products to the toys category.`);
  console.log("=================================================");
}

findToysAndRestore2();
