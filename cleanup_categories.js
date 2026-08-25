const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const categoriesToCheck = ['السماعات', 'جرابات السماعات', 'جرابات الموبايل', 'سمعات و جربات', 'الاكترونيات', 'لابات\\اكسسورات'];
  
  const { data: sections } = await supabaseAdmin.from('sections').select('id, title, category');
  
  for (const c of categoriesToCheck) {
    const section = sections.find(s => s.title === c);
    if (section) {
      const { count } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('category', section.category);
      console.log(`Category "${c}" has ${count} products.`);
      if (count === 0) {
        console.log(`Deleting empty category "${c}"...`);
        await supabaseAdmin.from('sections').delete().eq('id', section.id);
      }
    } else {
       console.log(`Category "${c}" not found.`);
    }
  }
}

run();
