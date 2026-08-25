const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: existingCategories } = await supabaseAdmin.from('sections').select('id, category').eq('title', '????????');
  const targetCategoryId = existingCategories[0].category;
  
  await supabaseAdmin.from('products').update({ category: targetCategoryId }).like('title', '%?????? ??? ???? 3%');
  console.log("Fixed FreeBuds 3 Category");
}

run();
