const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixCarStarter() {
  console.log("=================================================");
  console.log("FIXING CAR JUMP STARTER MISCLASSIFICATION");
  console.log("=================================================");

  // 1. Find the target subcategory (إلكترونيات السيارات OR أدوات ومستلزمات الطوارئ)
  let { data: targetCat } = await supabase.from('sections')
    .select('category, title')
    .ilike('title', '%إلكترونيات السيارات%')
    .single();

  if (!targetCat) {
    console.log("Could not find 'إلكترونيات السيارات'. Looking for 'أدوات ومستلزمات الطوارئ'...");
    const { data: fallbackCat } = await supabase.from('sections')
      .select('category, title')
      .ilike('title', '%الطوارئ%')
      .single();
    targetCat = fallbackCat;
  }

  // If it still doesn't exist, maybe it's under 'مستلزمات السيارات' parent? Let's check for the parent.
  let targetCatId;
  
  if (targetCat) {
    targetCatId = targetCat.category;
    console.log(`Found target category: ${targetCat.title} (${targetCatId})`);
  } else {
    console.log("Could not find the specific subcategories. Let's find the parent 'مستلزمات السيارات'...");
    const { data: parentCat } = await supabase.from('sections')
      .select('category, title')
      .ilike('title', '%مستلزمات السيارات%')
      .single();
      
    if (parentCat) {
      console.log(`Found parent category: ${parentCat.title} (${parentCat.category}). Creating 'إلكترونيات السيارات' subcategory...`);
      targetCatId = 'cat_carelectronics';
      await supabase.from('sections').upsert({
        id: 'sec_carelectronics',
        category: targetCatId,
        title: 'إلكترونيات السيارات',
        parent_id: parentCat.category,
        type: 'products_by_category',
        enabled: true
      }, { onConflict: 'id' });
    } else {
      console.error("Could not find ANY car categories. Creating from scratch...");
      const parentId = 'cat_carsupplies';
      await supabase.from('sections').upsert({
        id: 'sec_carsupplies',
        category: parentId,
        title: 'مستلزمات السيارات',
        type: 'products_by_category',
        enabled: true
      }, { onConflict: 'id' });

      targetCatId = 'cat_carelectronics';
      await supabase.from('sections').upsert({
        id: 'sec_carelectronics',
        category: targetCatId,
        title: 'إلكترونيات السيارات',
        parent_id: parentId,
        type: 'products_by_category',
        enabled: true
      }, { onConflict: 'id' });
    }
  }

  // 2. Find the Jump Starter products
  // Based on earlier logs, IDs might be: prod_B04M8FvJl ("مشغل سيارة محمول مع ضاغط هواء...")
  // and prod_B01eJ4ymr ("باور بانك للسيارة وستارتر لحال...")
  const { data: products } = await supabase.from('products').select('id, title, category');
  
  let moved = 0;
  for (const p of products) {
    const t = p.title.toLowerCase();
    if (t.includes('مشغل سيارة') || t.includes('ستارتر')) {
      console.log(`[FOUND] ${p.title} (ID: ${p.id}) currently in ${p.category}`);
      const { error } = await supabase.from('products').update({ category: targetCatId }).eq('id', p.id);
      if (error) {
        console.error(`Failed to move ${p.id}:`, error);
      } else {
        console.log(`✅ [MOVED] ${p.id} successfully moved to ${targetCatId} (إلكترونيات السيارات)`);
        moved++;
      }
    }
  }

  console.log("=================================================");
  console.log(`FIX COMPLETE! Moved ${moved} car jump starters to correct category.`);
  console.log("=================================================");
}

fixCarStarter();
