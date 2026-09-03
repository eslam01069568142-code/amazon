const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanupDuplicates() {
  console.log("=================================================");
  console.log("STARTING DUPLICATE TABS CLEANUP");
  console.log("=================================================");

  const merges = [
    {
      targetId: 'cat_audio',
      targetTitle: 'الصوتيات',
      sourceIds: ['cat_khnmn6p8m']
    },
    {
      targetId: 'cat_cameras',
      targetTitle: 'كاميرات مراقبة',
      sourceIds: ['cat_q8ol87c8r']
    },
    {
      targetId: 'cat_power',
      targetTitle: 'شواحن وباور بانك',
      sourceIds: ['cat_q4p0xeu9y', 'cat_z2p4a5gd3']
    },
    {
      targetId: 'cat_accessories',
      targetTitle: 'ملحقات وأجهزة',
      sourceIds: ['cat_zpw1oj2b7']
    }
  ];

  for (const merge of merges) {
    // 1. Update Target Title
    await supabase.from('sections').update({ title: merge.targetTitle }).eq('category', merge.targetId);
    console.log(`[UPDATED] Renamed ${merge.targetId} to "${merge.targetTitle}"`);

    // 2. Move Products
    for (const src of merge.sourceIds) {
      const { data: products } = await supabase.from('products').select('id').eq('category', src);
      if (products && products.length > 0) {
        await supabase.from('products').update({ category: merge.targetId }).eq('category', src);
        console.log(`[MOVED] ${products.length} products from ${src} to ${merge.targetId}`);
      }

      // 3. Delete Source Section
      const { error } = await supabase.from('sections').delete().eq('category', src);
      if (error) {
        console.error(`[ERROR] Deleting ${src}: ${error.message}`);
      } else {
        console.log(`[DELETED] Old section ${src}`);
      }
    }
  }

  // Find and delete any other EMPTY subcategories under Electronics
  const { data: allSubCats } = await supabase.from('sections').select('category').eq('parent_id', 'cat_uzhhuoj5g');
  
  if (allSubCats) {
    for (const cat of allSubCats) {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', cat.category);
      if (count === 0) {
        await supabase.from('sections').delete().eq('category', cat.category);
        console.log(`[DELETED] Empty section ${cat.category} to prevent empty tabs`);
      }
    }
  }

  console.log("=================================================");
  console.log("CLEANUP COMPLETE!");
  console.log("=================================================");
}

cleanupDuplicates();
