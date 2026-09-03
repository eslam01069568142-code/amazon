const { createClient } = require('@supabase/supabase-js');
const env = require('dotenv').config({ path: '.env.local' }).parsed || {};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function removeRedundantCategory() {
  console.log("=================================================");
  console.log("REMOVING REDUNDANT CATEGORY");
  console.log("=================================================");

  // 1. Move products back to Home & Kitchen
  const { data: products } = await supabase.from('products').select('id, title').eq('category', 'cat_toys');
  
  if (products && products.length > 0) {
    console.log(`Found ${products.length} products in cat_toys. Moving to cat_kitchentools...`);
    const { error } = await supabase.from('products').update({ category: 'cat_kitchentools' }).eq('category', 'cat_toys');
    if (error) {
      console.error("Failed to move products:", error.message);
    } else {
      console.log(`✅ Successfully moved ${products.length} products.`);
    }
  }

  // 2. Delete sections
  console.log("Deleting redundant sections...");
  await supabase.from('sections').delete().in('id', ['sec_toys_child', 'sec_toys_parent']);
  await supabase.from('sections').delete().in('category', ['cat_toys_parent', 'cat_toys']);
  
  console.log("✅ Successfully deleted redundant sections.");
  console.log("=================================================");
}

removeRedundantCategory();
