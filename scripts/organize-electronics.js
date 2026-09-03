const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function organizeElectronics() {
  console.log("=================================================");
  console.log("ORGANIZING ELECTRONICS TAXONOMY");
  console.log("=================================================");

  const subcats = [
    { id: 'sec_1059l9c0e', category: 'cat_khnmn6p8m', title: 'الصوتيات والميكروفونات', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true },
    { id: 'sec_jvufsldmw', category: 'cat_z2p4a5gd3', title: 'باور بانك وشواحن', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true },
    { id: 'sec_usfap2exr', category: 'cat_q8ol87c8r', title: 'كاميرات ذكية', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true },
    { id: 'sec_58etngpd7', category: 'cat_zpw1oj2b7', title: 'ملحقات وأجهزة', parent_id: 'cat_uzhhuoj5g', type: 'products_by_category', enabled: true }
  ];

  for (const s of subcats) {
    const { error } = await supabase
      .from('sections')
      .upsert({ id: s.id, category: s.category, title: s.title, parent_id: s.parent_id, type: s.type, enabled: s.enabled }, { onConflict: 'id' });
    if (error) {
      console.error(`Failed to upsert section ${s.category}:`, error.message);
    } else {
      console.log(`[SECTION] Ensured subcategory: ${s.title}`);
    }
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, title, category')
    .eq('category', 'cat_uzhhuoj5g');

  console.log(`Found ${products?.length || 0} products currently in parent category 'cat_uzhhuoj5g'. Moving to subcategories...`);

  let moved = 0;
  for (const p of (products || [])) {
    const t = p.title.toLowerCase();
    let newCat = null;

    if (t.match(/كاميرا/)) {
      newCat = 'cat_q8ol87c8r'; // Cameras
    } else if (t.match(/باور بانك|شاحن|ستارتر|شحن/)) {
      newCat = 'cat_z2p4a5gd3'; // Power & Chargers
    } else if (t.match(/سماعة|سماعات|ميكروفون/)) {
      newCat = 'cat_khnmn6p8m'; // Audio
    } else {
      newCat = 'cat_zpw1oj2b7'; // Accessories & Phones (default for rest of electronics)
    }

    if (newCat) {
      const { error } = await supabase.from('products').update({ category: newCat }).eq('id', p.id);
      if (!error) {
        console.log(`[MOVED] ${p.id} -> ${newCat} ("${p.title.substring(0, 30)}...")`);
        moved++;
      }
    }
  }

  console.log("=================================================");
  console.log(`ORGANIZATION COMPLETE! Moved ${moved} products to subcategories.`);
  console.log("=================================================");
}

organizeElectronics();
